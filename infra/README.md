# Hosting on AWS

The site runs on AWS for about $1–2 a month. Every push to `main` deploys it automatically, using [.github/workflows/deploy.yml](../.github/workflows/deploy.yml).

```
Browser ─▶ CloudFront (nickshouseofhorrors.com, www redirects to it)
             ├─ /_next/static, /assets ─▶ S3
             └─ everything else        ─▶ Lambda (Next.js server in a Docker image)
                                            └─ DynamoDB (shared cache), TMDB, Watchmode, Supabase
```

| Stack                           | File            | When it's deployed                      |
| ------------------------------- | --------------- | --------------------------------------- |
| `nickshouseofhorrors-bootstrap` | `bootstrap.yml` | Once, by you                            |
| `nickshouseofhorrors-dns-zone`  | `dns-zone.yml`  | Once, by you                            |
| `nickshouseofhorrors-dns-cert`  | `dns-cert.yml`  | Once, by you, after the Wix switch      |
| `nickshouseofhorrors-app`       | `app.yml`       | Every push to `main`, by GitHub Actions |

The stack names matter, because the workflow looks them up by name.

## One-time setup

All commands run from the repo root, in **us-east-1**.

### 1. Install the AWS CLI and sign in

Install AWS's official macOS package, https://awscli.amazonaws.com/AWSCLIV2.pkg (no Homebrew needed). Then check it in a new Terminal window:

```bash
aws --version
```

To skip installing anything, use **CloudShell** instead: the `>_` icon in the AWS console. It's a browser terminal that's already signed in.

Don't use the root account's keys. In the AWS console, open **IAM Identity Center**:

1. Turn it on.
2. Create a user for yourself.
3. Give it the **AdministratorAccess** permission set.

Then sign in from the terminal:

```bash
aws configure sso          # region: us-east-1
aws sts get-caller-identity   # should show your account
```

If you used a profile name other than `default`, add `--profile <name>` to the commands below, or run `export AWS_PROFILE=<name>`.

### 2. Bootstrap

This creates the GitHub deploy role, the Lambda role, the image repository, the static files bucket and the cache table.

```bash
aws cloudformation deploy \
  --stack-name nickshouseofhorrors-bootstrap \
  --template-file infra/bootstrap.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

It fails with "already exists" if this AWS account already has a GitHub OIDC provider. In that case, find its ARN under IAM → Identity providers, then add:
`--parameter-overrides ExistingGitHubOidcProviderArn=arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com`

### 3. Move DNS from Wix to Route 53

**Before switching**, in Wix:

- Copy down every DNS record, especially any **MX** records (email). Anything you don't recreate in Route 53 stops working.
- Turn off DNSSEC if it's on.

Then create the hosted zone and print its nameservers:

```bash
aws cloudformation deploy \
  --stack-name nickshouseofhorrors-dns-zone \
  --template-file infra/dns-zone.yml

aws cloudformation describe-stacks --stack-name nickshouseofhorrors-dns-zone \
  --query "Stacks[0].Outputs[?OutputKey=='NameServers'].OutputValue" --output text
```

1. In Wix, go to your domain's nameserver settings, click **Use custom nameservers**, and paste the 4 values.
2. If you had email or other records, add them in the AWS console under Route 53 → Hosted zones → nickshouseofhorrors.com → Create record.

Nameserver changes usually take effect within an hour, but can take up to 48 hours. Check with:

```bash
dig NS nickshouseofhorrors.com +short   # should list the awsdns servers
```

### 4. HTTPS certificate

Once `dig` shows the AWS nameservers:

```bash
aws cloudformation deploy \
  --stack-name nickshouseofhorrors-dns-cert \
  --template-file infra/dns-cert.yml
```

This waits until AWS issues the certificate. That's usually a few minutes, but if it times out, just run it again.

### 5. Budget alert (do this)

The site bills per request, so a bot flood could cost money. Set up an alert:

1. In the AWS console, go to **Billing → Budgets → Create budget**.
2. Pick the **Monthly cost budget** template.
3. Set it to **$5**, with your email.

### 6. GitHub settings

Open the repo on GitHub and go to **Settings → Secrets and variables → Actions**.

**Secrets** (Secrets tab):

| Name                     | Value                                       |
| ------------------------ | ------------------------------------------- |
| `TMDB_API_KEY`           | from `.env.local`                           |
| `WHERE_TO_WATCH_API_KEY` | from `.env.local`                           |
| `SUPABASE_SECRET_KEY`    | from `.env.local`                           |
| `ORIGIN_VERIFY_SECRET`   | a new random string: `openssl rand -hex 32` |

**Variables** (Variables tab):

| Name                                   | Value                                                 |
| -------------------------------------- | ----------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`                  | the bootstrap output `DeployRoleArn` (command below)  |
| `NEXT_PUBLIC_SUPABASE_URL`             | from `.env.local`                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from `.env.local`                                     |
| `NEXT_PUBLIC_SITE_URL`                 | `https://nickshouseofhorrors.com` (no trailing slash) |

```bash
aws cloudformation describe-stacks --stack-name nickshouseofhorrors-bootstrap \
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" --output text
```

### 7. First deploy

Push to `main`, or click **Actions → Deploy → Run workflow**. The first run creates the app stack. CloudFront takes 5–15 minutes to set up the first time.

### 8. After it's live

- Work through the "When the domain is live" checklist in [TODO.md](../TODO.md): the Supabase redirect URLs, Google OAuth, and Search Console.
- Check that it's locked down. Get the Lambda's own address:

  ```bash
  aws cloudformation describe-stacks --stack-name nickshouseofhorrors-app \
    --query "Stacks[0].Outputs" --output table
  ```

  Opening `FunctionUrl` directly in a browser should show **Forbidden**.

## Everyday use

- **Deploy:** push to `main`. If lint, the type check, or the template check fails, nothing ships.
- **Logs:** CloudWatch → Log groups → `/aws/lambda/nickshouseofhorrors-web`.
- **Change a secret:** update it in GitHub, then run the workflow from the Actions tab.
- **Roll back:**
  - Open an older successful run in the Actions tab and choose **Re-run all jobs**. That rebuilds and deploys that commit.
  - Or `git revert` the bad commit and push. The image repository keeps the last 10 images.

## When something goes wrong

- **The first deploy failed, and the stack shows `ROLLBACK_COMPLETE`.** It can't be updated. Delete it, then run the workflow again:
  ```bash
  aws cloudformation delete-stack --stack-name nickshouseofhorrors-app
  ```
- **The stack shows `UPDATE_ROLLBACK_FAILED`.**
  ```bash
  aws cloudformation continue-update-rollback --stack-name nickshouseofhorrors-app
  ```
- **The site shows "Forbidden" everywhere.** The `ORIGIN_VERIFY_SECRET` in GitHub and the deployed one don't match. Run the workflow again.
- **Error 403 straight from Lambda (not "Forbidden").** The function URL permissions are missing. Both `WebFunctionUrlPermission` and `WebFunctionInvokePermission` must exist in the stack.
- **Signing in lands on the wrong site.** `NEXT_PUBLIC_SITE_URL` is wrong, or the Supabase redirect URLs don't include the domain.

## Costs

| Item                           | About                     |
| ------------------------------ | ------------------------- |
| Lambda, CloudFront, CloudWatch | free tier at this traffic |
| Route 53 hosted zone           | $0.50/month               |
| Image repository (ECR)         | ~$0.20/month              |
| S3, DynamoDB                   | pennies                   |

The first visit after the site has been idle for a while takes 1–3 seconds longer, while Lambda starts up.
