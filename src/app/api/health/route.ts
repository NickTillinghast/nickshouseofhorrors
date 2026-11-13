// The Lambda Web Adapter calls this before sending visitors to a fresh server.
// No outside calls, so it only answers "is the server up"
export function GET() {
  return new Response("ok");
}
