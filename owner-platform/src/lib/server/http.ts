import { assertOrigin, HttpError, privateResponse } from "./security";
import { config } from "./supabase";
export function endpoint(
  fn: (request: Request) => Promise<Response>,
  mutation = false,
) {
  return async (request: Request) => {
    try {
      if (mutation) assertOrigin(request, config().appUrl);
      const response = await fn(request);
      return privateResponse(response);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 400;
      return privateResponse(
        Response.json(
          { error: error instanceof Error ? error.message : "Request failed." },
          { status },
        ),
      );
    }
  };
}
