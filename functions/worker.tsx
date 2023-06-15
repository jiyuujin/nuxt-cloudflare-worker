/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import handleProxy from './proxy'
import handleRedirect from './redirect'
import apiRouter from './router'

import satori, { init } from 'satori/wasm'
import initYoga from 'yoga-wasm-web'
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import { Preview } from './preview'

// @ts-expect-error
import yogaWasm from '../node_modules/yoga-wasm-web/dist/yoga.wasm'
// @ts-expect-error
import resvgWasm from '../node_modules/@resvg/resvg-wasm/index_bg.wasm'

init(await initYoga(yogaWasm))
await initWasm(resvgWasm)

type Env = {
  R2: R2Bucket
  CACHE_ENDPOINT: string
}

let fontCache: null | ArrayBuffer = null

const usedCache = false

// Export a default object containing event handlers
export default {
  // The fetch handler is invoked when this worker receives a HTTP(S) request
  // and should return a Response (optionally wrapped in a Promise)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
    const url = new URL(request.url)

    // You can get pretty far with simple logic like if/switch-statements
    switch (url.pathname) {
      case '/redirect':
        return handleRedirect.fetch(request, env, ctx)

      case '/proxy':
        return handleProxy.fetch(request, env, ctx)
    }

    if (url.pathname.startsWith('/api/')) {
      // You can also use more robust routing
      return apiRouter.handle(request)
    }

    const title = url.searchParams.get('title')
    if (!title) {
      return new Response('Parameter not definer: title')
    }
    if (title.includes('/')) {
      return new Response('Bad parameter: title', { status: 400 })
    }

    const isTwitterBot = request.headers.get('user-agent')?.includes('Twitterbot') ?? false
    if (isTwitterBot) {
      const cache = await env.R2.get(`cache/${title}.png`)
      if (cache) {
        return new Response(cache.body, {
          headers: {
            'Cache-Status': '"Cloudflare R2"; hit',
            'Content-Type': 'image/png',
          },
        })
      }
    }

    if (usedCache) {
      const cache = await fetch(`${env.CACHE_ENDPOINT}/${title}.png`, { method: 'HEAD' })
      if (cache.status === 200) {
        return Response.redirect(`${env.CACHE_ENDPOINT}/${title}.png`, 301)
      }
    }

    if (!fontCache) {
      const fontObject = await env.R2.get('fonts/NotoSansJP-Regular.ttf')

      if (!fontObject) {
        return new Response('Internal Server Error: font not exist.', {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }

      fontCache = await fontObject.arrayBuffer()
      if (!fontCache) {
        return new Response('Internal Server Error: font not exist.', {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    }

    const svg = await satori(<Preview title={title} />, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'NotoSansJP',
          data: fontCache,
          weight: 100,
          style: 'normal',
        },
      ],
    })

    const image = new Resvg(svg).render().asPng()

    if (usedCache) {
      await env.R2.put(`cache/${title}.png`, image)
    }

    return new Response(image, {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  },
}
