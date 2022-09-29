import type { APIRoute } from 'astro';
import { fetchSchema } from '../near/schema';

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
    let message: string;
    if (e instanceof Error) {
      message = e.message
    } else {
      message = String(e)
    }
    return new Response(JSON.stringify({
      error: message
    }), {
      status: 501 // not implemented
    });
  }
}