 I USED A BOOTSTRAP FRAMEWORK FOR THE PROJECT

✅ Custom smooth scroll animation with cubic easing
- ✅ **No horizontal overflow** on any device
- ✅ **Perfect mobile experience** with touch-friendly navigation
- ✅ **Consistent behavior** across all browsers and devices
- ✅ **Professional appearance** with Bootstrap's design standards
- ✅ **Easy maintenance** with standard Bootstrap classes

## Deploying on Vercel

- Install the [Vercel CLI](https://vercel.com/docs/cli) and log in: `npm i -g vercel && vercel login`.
- Create a MySQL database that is reachable from Vercel (for example Neon, PlanetScale, or Railway) and note the connection credentials.
- In the Vercel dashboard (or via `vercel env`), add the environment variables defined in `.env.example`. You can use either discrete values (`DB_HOST`, `DB_USER`, etc.) or a full `DATABASE_URL`.
- Deploy with `vercel` (preview) and `vercel --prod` (production). The included `vercel.json` config wires every `.php` file through the `@vercel/php` runtime and routes all other requests to `index.php`.
- Static assets under `Assets/` are served as static files automatically; keep the casing in URLs (`Assets/...`) to avoid 404s.
- PHP sessions on Vercel are ephemeral. Consider replacing `$_SESSION` usage with a database or token-based session store before going live.