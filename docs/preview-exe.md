# Preview on exe.dev

This VM's preview serves the existing production build through the local Cloudflare Pages runtime:

- On the VM: `http://localhost:3000/`
- Through exe.dev: `https://repos-dev.exe.xyz:3000/`
- Bind address: `0.0.0.0:3000`
- Service: `data-analyst-preview.service` (user systemd)

The [documented exe.dev proxy](https://exe.dev/docs/proxy.md) handles HTTPS and restricts alternate-port access to users who can access the VM. No public-sharing setting or default proxy target is changed. Sign in to exe.dev if prompted. The application serves its local `dist/` build; this does not deploy to the production site.

## Build and control

```bash
npm run build:fast
systemctl --user restart data-analyst-preview.service
systemctl --user status data-analyst-preview.service --no-pager
journalctl --user -u data-analyst-preview.service -n 60 --no-pager
```

The unit is linked from `ops/data-analyst-preview.service` into the user service directory and enabled for the user manager. User lingering is enabled on this VM, so the preview continues after logout and starts again at boot. It restarts automatically after a process failure.

To stop it: `systemctl --user stop data-analyst-preview.service`. For a foreground session instead, stop the service first and run `npm run preview:vm`.

## Data and runtime

The preview uses the existing consolidated `API_ORIGIN` in `wrangler.jsonc`, accessed through the same-origin Pages Functions. This makes the interactive dashboards usable without downloading their missing local datasets. Backend-only corrections in the working tree are not deployed to that remote API. The case narratives, retained evidence, and regenerated downloadable reports come from the local build.

The preview uses static exported assets, so Next.js development-host or hot-reload settings are unnecessary. Rebuild and restart after source changes. The inspector uses port 9231 to avoid the separate screenshot preview's inspector.
