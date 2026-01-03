import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";

export default function RouteError() {
  const err = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(err)) {
    title = `${err.status} ${err.statusText}`;
    message = err.data?.message || message;
  } else if (err instanceof Error) {
    message = err.message;
  } else {
    // avoid String(err) which can throw on some objects
    message = "A route failed to render. Check the console for details.";
  }

  return (
    <Container>
      <div className="py-16">
        <div className="text-2xl font-semibold">{title}</div>
        <p className="mt-3 text-sm text-black/70">{message}</p>
        <div className="mt-6">
          <Link to="/">
            <Button variant="secondary">Go Home</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
