import type { APIRoute } from 'astro';
import { fetchSchema } from '../near/schema';
import * as errors from '../near/errors';

export const get: APIRoute = async ({ params }) => {
  const { contract } = params;

  if (!contract || typeof contract === "number") {
    return new Response(JSON.stringify({
      error: `Invalid contract: ${contract}; must be a string`
    }), {
      status: 400
    })
  }

  try {
    return new Response(JSON.stringify(await fetchSchema(contract)), {
      status: 200
    })
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e)
    let status: number = 501 // not implemented

    if (e instanceof errors.UnknownNetwork) {
      status = 400 // bad request
    }

    return new Response(JSON.stringify({ error }), { status });
  }
}
