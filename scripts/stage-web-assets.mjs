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
function stage(directory, base = directory, prefix = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { stage(file, base, prefix); continue }
    if (prefix.startsWith('research/') && !/\.(ipynb|md|pdf|py|sql|html)$/.test(entry.name)) continue
    const relative = path.join(prefix, path.relative(base, file))
    const hash = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    if (manifest.has(relative) && manifest.get(relative) !== hash) throw new Error(`Conflicting public asset: ${relative}`)
    manifest.set(relative, hash)
    const destination = path.join(output, relative)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(file, destination)
  }
}
for (const source of sources) stage(path.join(root, 'projects', source, 'public'))
// Original research is available on the same site, independent of repository hosting.
for (const source of sources) {
  const project = source.replace(/\/web$/, '')
  const directory = path.join(root, 'projects', project)
  for (const folder of ['notebooks', 'reports', 'data-pipeline']) {
    const research = path.join(directory, folder)
    if (fs.existsSync(research)) stage(research, research, `research/projects/${project}/${folder}`)
  }
}
const audit = path.join(root, 'docs/evidence-audit.md')
if (fs.existsSync(audit)) {
  fs.mkdirSync(path.join(output, 'research'), { recursive: true })
  fs.copyFileSync(audit, path.join(output, 'research/evidence-audit.md'))
}
const reference = path.join(root, 'projects/latex-portfolio-deepdive/main.pdf')
if (fs.existsSync(reference)) {
  fs.mkdirSync(path.join(output, 'research'), { recursive: true })
  fs.copyFileSync(reference, path.join(output, 'research/analytical-reference.pdf'))
}
console.log(`Staged ${manifest.size} research assets for the unified frontend.`)
