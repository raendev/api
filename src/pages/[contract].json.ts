import type { APIContext } from 'astro';

export async function get({ params }: APIContext) {
  const { contract } = params;

  return new Response(JSON.stringify(contract), {
    status: 200
  });
}