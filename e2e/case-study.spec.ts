import { test, expect } from './fixtures'
import type { APIRequestContext } from '@playwright/test'
import { caseStudies } from '../apps/web/src/lib/case-studies'

const cases = [
  ['insurance', '/insurance/'], ['ecommerce', '/olist/'], ['ecommerce', '/cohorts/'],
  ['abtest', '/abtest/'], ['kpi', '/kpi/'], ['portfolio', '/portfolio/'],
  ['operations', '/operations/'], ['airbnb', '/airbnb/'],
] as const

async function expectLocalResearch(request: APIRequestContext, href: string) {
  if (!href.startsWith('/')) return
  const response = await request.get(href)
  expect(response.status(), href).toBe(200)
  if (href.endsWith('.ipynb')) {
    expect((await response.json()).nbformat, href).toBe(4)
  } else if (href.endsWith('.pdf')) {
    expect(response.headers()['content-type'], href).toContain('application/pdf')
    expect((await response.body()).subarray(0, 5).toString(), href).toBe('%PDF-')
  } else if (/\.(py|md)$/.test(href)) {
    expect(await response.text(), href).not.toMatch(/<!doctype html>/i)
    expect((await response.body()).length, href).toBeGreaterThan(100)
  } else {
    expect(response.headers()['content-type'], href).toContain('text/html')
  }
}

for (const [id, path] of cases) {
  test(`${path} tells a complete case story without a backend`, async ({ page }) => {
    const apiRequests: string[] = []
    const errors: string[] = []
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url())
    })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(path)
    const story = page.locator('main.case-story')
    const content = caseStudies[id]
    await expect(story).toBeVisible()
    await expect(page.locator('.case-intro h1')).toHaveText(content.title.en)
    await expect(story.getByText(content.question.en, { exact: true })).toBeVisible()
    await expect(story.getByText(content.finding.en, { exact: true })).toBeVisible()
    await expect(story.getByText(content.evidenceLabel.en, { exact: true })).toBeVisible()
    await expect(story.locator('.evidence-figure')).toHaveCount(1)
    for (const section of content.sections) {
      await expect(story.getByRole('heading', { name: section.title.en, exact: true })).toBeVisible()
      await expect(story.getByText(section.body.en, { exact: true })).toBeVisible()
    }
    await expect(story.getByText(content.decision.en, { exact: true })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(apiRequests).toEqual([])
    expect(errors).toEqual([])
  })
}

test('case view history survives back, forward, and refresh', async ({ page }) => {
  await page.goto('/portfolio/')
  const views = page.getByRole('navigation', { name: 'Case study views' })
  await views.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page).toHaveURL(/view=explore/)
  await expect(page.getByRole('button', { name: 'Risk', exact: true })).toBeVisible()
  await expect(page.locator('main.case-story')).toHaveCount(0)
  await views.getByRole('button', { name: 'Methods & sources', exact: true }).click()
  await expect(page).toHaveURL(/view=methods/)
  await expect(page.getByRole('link', { name: 'Portfolio construction notebook', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/view=explore/)
  await expect(page.getByRole('button', { name: 'Risk', exact: true })).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/view=methods/)
  await page.reload()
  await expect(page.getByRole('link', { name: 'Portfolio construction notebook', exact: true })).toBeVisible()
  await views.getByRole('button', { name: 'Case study', exact: true }).click()
  await expect(page.locator('main.case-story')).toBeVisible()
  await page.reload()
  await expect(page.locator('main.case-story')).toBeVisible()
})

test('legacy section bookmarks open exploration directly', async ({ page }) => {
  await page.goto('/portfolio/?section=risk')
  const risk = page.getByRole('button', { name: 'Risk', exact: true })
  await expect(risk).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('main.case-story')).toHaveCount(0)
  await page.reload()
  await expect(risk).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'About', exact: true }).click()
  await expect(page.getByRole('button', { name: 'About', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('main.case-story')).toHaveCount(0)
})

test('footer actions bring the selected view and keyboard focus into view', async ({ page }) => {
  await page.goto('/insurance/')
  const views = page.getByRole('navigation', { name: 'Case study views' })
  const footer = page.locator('.case-next')
  await footer.getByRole('button', { name: 'Explore the analysis', exact: true }).click()
  await expect(page).toHaveURL(/view=explore/)
  const explore = views.getByRole('button', { name: 'Explore', exact: true })
  await expect(explore).toHaveAttribute('aria-current', 'page')
  await expect(explore).toBeFocused()
  await expect(explore).toBeInViewport()
  await views.getByRole('button', { name: 'Case study', exact: true }).click()
  await footer.getByRole('button', { name: 'Methods & sources', exact: true }).click()
  await expect(page).toHaveURL(/view=methods/)
  const methods = views.getByRole('button', { name: 'Methods & sources', exact: true })
  await expect(methods).toHaveAttribute('aria-current', 'page')
  await expect(methods).toBeFocused()
  await expect(methods).toBeInViewport()
})

test('insurance year control changes the observed share and remains keyboard usable', async ({ page }) => {
  await page.goto('/insurance/')
  const figure = page.locator('.evidence-figure')
  const year = figure.getByLabel('Follow an accident year')
  await expect(year).toHaveValue('1997')
  const initial = await figure.locator('.figure-big-number').textContent()
  await year.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('Enter')
  await expect(year).toHaveValue('1988')
  await expect(figure.locator('.figure-big-number')).not.toHaveText(initial!)
  await expect(figure.locator('.matrix-selected')).toContainText('1988')
  await expect(figure.getByRole('img')).toHaveAttribute('aria-label', /paid/)
})

test('measured figures and constructed illustrations are labeled separately', async ({ page }) => {
  for (const [path, label] of [
    ['/insurance/', 'Retained evidence'], ['/cohorts/', 'Retained evidence'],
    ['/airbnb/', 'Retained evidence'], ['/abtest/', 'Illustrative example'],
    ['/kpi/', 'Retained evidence'], ['/portfolio/', 'Illustrative example'],
    ['/operations/', 'Illustrative example'],
  ]) {
    await page.goto(path)
    await expect(page.locator('.evidence-figure .evidence-tag')).toHaveText(label)
    await expect(page.locator('.evidence-figure figcaption')).not.toBeEmpty()
  }
})

test('methods preserve evidence disclosures and valid research links', async ({ page, request }) => {
  const checked = new Set<string>()
  for (const [id, path] of cases) {
    if (checked.has(id)) continue
    checked.add(id)
    const content = caseStudies[id]
    await page.goto(`${path}?view=methods`)
    for (const limitation of content.limitations) {
      await expect(page.getByText(limitation.en, { exact: true })).toBeVisible()
    }
    for (const source of content.sources) {
      await expect(page.getByRole('link', { name: source.label, exact: true })).toHaveAttribute('href', source.href)
      await expectLocalResearch(request, source.href)
    }
    for (const artifact of content.artifacts) {
      await expect(page.getByRole('link', { name: artifact.label.en, exact: true })).toHaveAttribute('href', artifact.href)
      await expectLocalResearch(request, artifact.href)
    }
    const audit = page.getByRole('link', { name: 'Read the evidence audit', exact: true })
    await expect(audit).toHaveAttribute('href', '/research/evidence-audit.md')
    await expectLocalResearch(request, '/research/evidence-audit.md')
  }
})

test('stories and methods follow language and theme preferences', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/insurance/')
  await page.getByRole('button', { name: 'Switch to Spanish', exact: true }).click()
  await page.getByRole('button', { name: 'Cambiar a tema oscuro', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('.case-intro h1')).toHaveText(caseStudies.insurance.title.es)
  await expect(page.getByLabel('Seguir un año de accidente')).toBeVisible()
  await page.goto('/abtest/?view=methods')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByText(caseStudies.abtest.limitations[0].es, { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pipeline de enriquecimiento', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByText(caseStudies.abtest.limitations[0].es, { exact: true })).toBeVisible()
})

test('experiment illustration changes with keyboard input without claiming measured results', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/abtest/')
  const figure = page.locator('.evidence-figure')
  const above = figure.getByRole('button', { name: 'Above zero', exact: true })
  await above.focus()
  await page.keyboard.press('Enter')
  await expect(above).toHaveAttribute('aria-pressed', 'true')
  await expect(figure.getByText('The interval is above zero', { exact: true })).toBeVisible()
  await expect(figure.locator('figcaption')).toContainText('These are not results from the experiment')
})
