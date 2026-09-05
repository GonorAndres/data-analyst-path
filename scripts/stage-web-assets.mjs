/** Stage research artifacts into the generated public directory, preserving URLs. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sources = [
  '00-demo-aestehtics', '01-insurance-claims-dashboard', '02-ecommerce-cohort-analysis/web',
  '03-ab-test-analysis', '04-executive-kpi-report', '05-financial-portfolio-tracker', '06-operational-efficiency',
]
const output = path.join(root, 'apps/web/public')
const manifest = new Map()
function stage(directory, base = directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { stage(file, base); continue }
    const relative = path.relative(base, file)
    const hash = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    if (manifest.has(relative) && manifest.get(relative) !== hash) throw new Error(`Conflicting public asset: ${relative}`)
    manifest.set(relative, hash)
    const destination = path.join(output, relative)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(file, destination)
  }
}
for (const source of sources) stage(path.join(root, 'projects', source, 'public'))
console.log(`Staged ${manifest.size} research assets for the unified frontend.`)
