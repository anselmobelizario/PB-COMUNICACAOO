import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { buildGalleryManifest } from '../scripts/generate-gallery-ratios.mjs';

test.describe('site institucional P&B', () => {
  // The page ships prerendered: elements exist before React hydrates, so
  // every navigation waits for the hydrated flag before interacting.
  const openPage = async (page, path = '/') => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-hydrated="true"]');
    // The flag marks the root commit; lazy section chunks still land after
    // it, and networkidle is the cheap deterministic wait for those.
    await page.waitForLoadState('networkidle');
  };
  test('apresenta a proposta e permite filtrar o portfólio', async ({ page }) => {
    await openPage(page, '/');

    await expect(page.locator('h1')).toContainText('24 anos.');
    await expect(page.locator('h1')).toContainText('Causando impacto.');
    await expect(page.getByText('Somos a P&B Comunicação Visual.')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/CNPJ/i);

    const portfolio = page.locator('#portfolio');
    await expect(portfolio).toBeVisible();
    await portfolio.scrollIntoViewIfNeeded();

    const tabs = portfolio.getByRole('tab');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(0)).toContainText('Adesivação de veículos');
    await expect(tabs.nth(1)).toContainText('Adesivação geral');
    await expect(tabs.nth(2)).toContainText('Banner / Lona');
    await expect(tabs.nth(3)).toContainText('PDVs e materiais diversos');
    await expect(tabs.nth(4)).toContainText('Essência P&B');
    await expect(portfolio.locator('.portfolio-mosaic-tile')).toHaveCount(42);
    await expect(portfolio.locator('.portfolio-mosaic-group')).toHaveCount(22);

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(portfolio.locator('.portfolio-mosaic-tile')).toHaveCount(40);
    await expect(portfolio.locator('.portfolio-mosaic-group')).toHaveCount(38);

    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    const bannerPanel = portfolio.getByRole('tabpanel');
    await expect(bannerPanel.locator('.portfolio-mosaic-tile')).toHaveCount(14);
    await expect(bannerPanel.locator('.portfolio-mosaic-group')).toHaveCount(14);

    await tabs.nth(3).click();
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
    const pdvPanel = portfolio.getByRole('tabpanel');
    await expect(pdvPanel.locator('.portfolio-mosaic-tile')).toHaveCount(13);
    await expect(pdvPanel.locator('.portfolio-mosaic-group')).toHaveCount(13);
  });

  test('a aba Essência P&B anuncia vídeos em vez de fotos e não abre mosaico vazio', async ({ page }) => {
    await openPage(page, '/');

    const portfolio = page.locator('#portfolio');
    await portfolio.scrollIntoViewIfNeeded();

    const producaoTab = portfolio.getByRole('tab').nth(4);
    await expect(producaoTab).toContainText('10 vídeos');
    // Tabs only reference their panel once it exists (selected); the ARIA
    // tabs pattern allows lazily created panels.
    await producaoTab.click();
    await expect(producaoTab).toHaveAttribute('aria-selected', 'true');
    await expect(producaoTab).toHaveAttribute('aria-controls', 'portfolio-panel-producao');

    const count = portfolio.locator('.portfolio-project-count');
    await expect(count).toContainText('vídeos');
    await expect(count).toContainText('em Essência P&B');
    await expect(count).not.toContainText('fotos');
    await expect(portfolio.locator('.portfolio-mosaic-group')).toHaveCount(0);

    const panel = portfolio.getByRole('tabpanel');
    await expect(panel).toHaveAttribute('id', 'portfolio-panel-producao');
    await expect(panel).toHaveClass(/portfolio-tabpanel-videos/);
    await expect(panel).not.toHaveClass(/is-empty/);
    await expect(panel.locator('.portfolio-production')).toBeVisible();
    await expect(panel.locator('.portfolio-video-carousel')).toBeVisible();
    await expect(portfolio.locator('.portfolio-production')).toHaveCount(1);
  });

  test('apresenta o showreel de vídeos com navegação e pausa', async ({ page }) => {
    await openPage(page, '/');

    const carousel = page.locator('.portfolio-video-carousel');
    await carousel.scrollIntoViewIfNeeded();
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('.portfolio-video-grid')).toHaveCount(0);
    const dots = carousel.locator('.portfolio-video-carousel-dot');
    await expect(dots.first()).toBeVisible();
    const videoCount = await dots.count();
    expect(videoCount).toBeGreaterThan(1);
    await expect(carousel.locator('video')).toHaveCount(2);

    const playback = await carousel.locator('video').first().evaluate((video) => ({
      autoplay: video.autoplay,
      muted: video.muted,
      playsInline: video.playsInline,
    }));
    expect(playback).toEqual({ autoplay: true, muted: true, playsInline: true });

    await carousel.getByRole('button', { name: 'Próximo vídeo' }).click();
    await expect(carousel.locator('.portfolio-video-carousel-counter')).toHaveText(`02 / ${String(videoCount).padStart(2, '0')}`);
    await expect(carousel.locator('.portfolio-video-carousel-dot.is-active')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const playbackButton = carousel.getByRole('button', { name: 'Pausar showreel' });
    await playbackButton.click();
    await expect(carousel.getByRole('button', { name: 'Reproduzir showreel' })).toBeVisible();
    await carousel.getByRole('button', { name: 'Reproduzir showreel' }).click();
    await expect(carousel.getByRole('button', { name: 'Pausar showreel' })).toBeVisible();
  });

  test('respeita carregamento sob demanda e movimento reduzido no showreel', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPage(page, '/');

    const carousel = page.locator('.portfolio-video-carousel');
    await expect(carousel.locator('img').first()).toHaveAttribute('loading', 'lazy');

    await carousel.scrollIntoViewIfNeeded();
    await expect(carousel.locator('img').first()).toHaveAttribute('loading', 'eager');
    await expect(carousel.getByRole('button', { name: 'Reproduzir showreel' })).toBeVisible();
    await expect(carousel.locator('img').first()).not.toHaveClass(/is-hidden/);

    await carousel.hover();
    await expect(carousel).toHaveCSS('transform', 'none');

    const materialsVideo = page.locator('.materials-video');
    await materialsVideo.scrollIntoViewIfNeeded();
    await expect(materialsVideo.getByRole('button', { name: /Reproduzir vídeo/i })).toBeVisible();
    await expect(materialsVideo.getByRole('button', { name: /Próximo vídeo/i })).toBeVisible();
    await expect(materialsVideo.locator('.materials-video-slide.is-active img')).not.toHaveClass(/is-hidden/);
  });

  test('mantém FAQ, orçamento e menu mobile operacionais', async ({ page }) => {
    await openPage(page, '/');

    const faq = page.locator('#faq');
    await faq.scrollIntoViewIfNeeded();
    const question = faq.getByRole('button').first();
    await expect(question).toHaveAttribute('aria-expanded', 'false');
    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', 'true');
    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', 'false');

    const form = page.locator('#contato form');
    await form.scrollIntoViewIfNeeded();
    await form.getByRole('button', { name: /Enviar pelo WhatsApp/i }).click();
    await expect(form.getByRole('alert')).toContainText('Confira os campos destacados');

    const budgetLink = page.locator('a').filter({ hasText: 'Solicite seu Orçamento' }).first();
    await expect(budgetLink).toHaveAttribute('href', /whatsapp/i);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-hydrated="true"]');
    const menuButton = page.getByRole('button', { name: 'Abrir menu' });
    await menuButton.click();
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Menu de navegação' }).getByRole('link', { name: 'Portfólio' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toHaveCount(0);
  });

  test('mantém o menu mobile compacto e alcançável em qualquer celular', async ({ page }) => {
    for (const [width, height] of [[320, 568], [390, 844], [667, 375]]) {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await page.getByRole('button', { name: 'Abrir menu' }).click();
      const drawer = page.getByRole('dialog', { name: 'Menu de navegação' });
      await expect(drawer).toBeVisible();

      const layout = await drawer.evaluate((d) => {
        const nav = d.querySelector('nav');
        const card = nav.firstElementChild.getBoundingClientRect();
        const header = d.children[1].getBoundingClientRect();
        const cta = d.children[3].querySelector('a').getBoundingClientRect();
        return {
          panelHeight: d.getBoundingClientRect().height,
          gapAboveLinks: card.top - header.bottom,
          ctaBottom: cta.bottom,
          ctaHeight: cta.height,
          scrolls: nav.scrollHeight > nav.clientHeight,
        };
      });
      const label = `${width}x${height}`;
      expect(layout.panelHeight, label).toBeLessThanOrEqual(height);
      expect(layout.ctaBottom, `${label}: CTA na tela`).toBeLessThanOrEqual(height);
      expect(layout.ctaHeight, `${label}: CTA em uma linha`).toBeLessThan(60);
      if (!layout.scrolls) expect(layout.gapAboveLinks, `${label}: sem vão vazio`).toBeLessThan(40);

      await drawer.getByRole('link', { name: 'Contato' }).scrollIntoViewIfNeeded();
      await expect(drawer.getByRole('link', { name: 'Contato' })).toBeInViewport();
    }
  });

  test('mantém o botão flutuante do WhatsApp no canto em qualquer tela', async ({ page }) => {
    for (const [width, height] of [[1280, 800], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');

      const button = page.getByRole('link', { name: 'Fale conosco pelo WhatsApp' });
      await expect(button).toHaveAttribute('href', /api\.whatsapp\.com\/send\?phone=5511965698725/);
      await expect(button).toHaveAttribute('target', '_blank');
      await expect(button).toBeInViewport();

      await page.locator('#contato').scrollIntoViewIfNeeded();
      await button.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
      const box = await button.boundingBox();
      // html reserves a stable scrollbar gutter, so only body's width excludes it
      const visible = await page.evaluate(() => ({
        width: document.body.clientWidth,
        height: window.innerHeight,
      }));
      const label = `${width}x${height}`;
      expect(visible.width - (box.x + box.width), `${label}: colado à direita`).toBeLessThan(24);
      expect(visible.height - (box.y + box.height), `${label}: colado embaixo`).toBeLessThan(24);
      expect(box.width, `${label}: alvo de toque`).toBeGreaterThanOrEqual(48);
    }

    // The open drawer must cover the button so it can't be tapped through it
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible();
    const topmost = await page.getByRole('link', { name: 'Fale conosco pelo WhatsApp' }).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    expect(topmost).toBe(false);
  });

  test('versiona as fotos da galeria em todas as variantes do srcset e no lightbox', async ({ page }) => {
    await openPage(page, '/');

    const portfolio = page.locator('#portfolio');
    await portfolio.scrollIntoViewIfNeeded();
    await expect(portfolio.getByRole('tab').first()).toBeVisible();

    const images = await page.locator('#servicos img, #portfolio .portfolio-mosaic-tile img').evaluateAll((imgs) => imgs.map((img) => ({
      src: img.getAttribute('src'),
      srcset: img.getAttribute('srcset') || '',
    })));
    expect(images.length).toBeGreaterThan(37);

    for (const { src, srcset } of images) {
      const version = src.match(/\?v=([0-9a-f]{8})$/)?.[1];
      expect(version, `versão em ${src}`).toBeTruthy();
      for (const candidate of srcset.split(',').map((entry) => entry.trim().split(/\s+/)[0]).filter(Boolean)) {
        expect(candidate, `srcset de ${src}`).toContain(`?v=${version}`);
      }
    }

    await portfolio.getByRole('button', { name: /Smart Truck Smart Fit amarelo/ }).click();
    await expect(page.locator('.portfolio-lightbox-stage img')).toHaveAttribute('src', /veiculo-09\.webp\?v=[0-9a-f]{8}$/);
  });

  test('o manifesto da galeria acompanha as fotos em disco', async () => {
    const committed = JSON.parse(await fs.readFile(new URL('../src/data/galleryImageRatios.json', import.meta.url), 'utf8'));
    expect(await buildGalleryManifest(), 'foto trocada sem rodar npm run generate-gallery-ratios').toEqual(committed);
  });

  test('reproduz o texto e as cores aprovadas no overlay do vídeo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openPage(page, '/?hero=a');

    const hero = page.locator('.hero-section');
    await expect(hero).toHaveClass(/hero-overlay/);
    await expect(hero.locator('.hero-title')).toHaveText('24 anos.Causando impacto.');
    await expect(hero.locator('.hero-intro')).toHaveText('Somos a P&B Comunicação Visual.');
    await expect(hero.locator('.hero-description p')).toHaveCount(3);
    await expect(hero.locator('.hero-description')).toContainText(
      'Desde 2002, tornamos marcas mais visíveis, próximas e admiradas.',
    );
    await expect(hero.locator('.hero-description')).toContainText(
      'Agilidade máxima e compromisso absoluto.',
    );
    await expect(hero.locator('.hero-badge')).toHaveCount(0);
    await expect(hero.locator('.hero-proof')).toHaveCount(0);
    await expect(hero.locator('.hero-actions')).toHaveCount(0);
    await expect(hero.locator('.hero-brand-logo')).toBeVisible();
    await expect(hero.locator('.hero-intro-mark-wave')).toHaveCount(1);

    const presentation = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      const media = document.querySelector('.hero-media-frame').getBoundingClientRect();
      const visual = document.querySelector('.hero-media-visual').getBoundingClientRect();
      const video = document.querySelector('.hero-video');
      const title = document.querySelector('.hero-title');
      const accent = document.querySelector('.hero-title-accent');

      return {
        palette: {
          green: rootStyle.getPropertyValue('--color-pb-accent').trim(),
          blue: rootStyle.getPropertyValue('--color-pb-accent-blue').trim(),
        },
        titleFill: getComputedStyle(title).webkitTextFillColor || getComputedStyle(title).color,
        accentFill: getComputedStyle(accent).webkitTextFillColor || getComputedStyle(accent).color,
        copyBottom: copy.bottom,
        mediaBottom: media.bottom,
        mediaRight: media.right,
        mediaLeft: media.left,
        viewportWidth: document.documentElement.clientWidth,
        mediaHeight: media.height,
        visualHeight: visual.height,
        videoFit: getComputedStyle(video).objectFit,
        copyOverMedia: copy.left >= media.left - 2 && copy.right <= media.right + 2,
      };
    });

    expect(presentation.palette).toEqual({ green: '#18aa2b', blue: '#0004e1' });
    expect(presentation.titleFill).toContain('55, 220, 85');
    expect(presentation.accentFill).toContain('255, 255, 255');
    expect(presentation.mediaBottom).toBeGreaterThanOrEqual(presentation.copyBottom - 2);
    expect(Math.abs(presentation.mediaHeight - presentation.visualHeight)).toBeLessThan(3);
    expect(presentation.mediaLeft).toBeLessThanOrEqual(2);
    expect(Math.abs(presentation.mediaRight - presentation.viewportWidth)).toBeLessThan(3);
    expect(presentation.videoFit).toBe('cover');
    expect(presentation.copyOverMedia).toBe(true);
  });

  test('o vídeo da hero começa sozinho, mudo e inline, sem pedir um clique', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openPage(page, '/');

    const video = page.locator('.hero-video');
    await expect(video).toHaveCount(1);
    await expect(page.locator('.hero-video-unblock')).toHaveCount(0);

    const playback = await video.evaluate((node) => ({
      autoplay: node.autoplay,
      muted: node.muted,
      playsInline: node.playsInline,
      loop: node.loop,
      hasSrc: Boolean(node.currentSrc || node.src),
    }));
    expect(playback).toEqual({
      autoplay: true,
      muted: true,
      playsInline: true,
      loop: true,
      hasSrc: true,
    });
  });

  test('o vídeo da hero segue no automático mesmo com movimento reduzido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/');

    await expect(page.locator('.hero-video')).toHaveCount(1);
    await expect(page.locator('.hero-video-unblock')).toHaveCount(0);
    await expect(page.locator('.hero-section').getByRole('button', { name: 'Reproduzir vídeo' })).toHaveCount(0);
  });

  test('oferece três geometrias responsivas para a hero', async ({ page }) => {
    test.slow();

    const variants = [
      { query: '', name: 'a' },
      { query: '?hero=a', name: 'a' },
      { query: '?hero=b', name: 'b' },
      { query: '?hero=c', name: 'c' },
      { query: '?hero=inválida', name: 'a' },
    ];

    await page.setViewportSize({ width: 1280, height: 900 });

    for (const variant of variants) {
      await openPage(page, `/${variant.query}`);
      await expect(page.locator('.hero-section')).toHaveAttribute('data-hero-variant', variant.name);
    }

    const geometry = async (query) => {
      await openPage(page, `/${query}`);
      return page.evaluate(() => {
        const shellElement = document.querySelector('.hero-shell');
        const copyElement = document.querySelector('.hero-copy');
        const mediaElement = document.querySelector('.hero-media-frame');
        const visualElement = document.querySelector('.hero-media-visual');
        const shell = shellElement.getBoundingClientRect();
        const copy = copyElement.getBoundingClientRect();
        const media = mediaElement.getBoundingClientRect();
        const visual = visualElement.getBoundingClientRect();

        const heroSection = document.querySelector('.hero-section');
        const heroPadTop = parseFloat(getComputedStyle(heroSection).paddingTop);
        const heroPadInline = parseFloat(getComputedStyle(heroSection).paddingLeft);
        const logo = document.querySelector('.site-navbar img')?.getBoundingClientRect();

        return {
          shell: { x: shell.x, y: shell.y, width: shell.width },
          copy: { x: copy.x, y: copy.y, width: copy.width, height: copy.height },
          media: {
            x: media.x,
            y: media.y,
            width: media.width,
            height: media.height,
            right: media.right,
          },
          viewportWidth: document.documentElement.clientWidth,
          heroPadTop,
          heroPadInline,
          logoX: logo?.x ?? null,
          layoutGap: media.x - copy.right,
          copySpan: getComputedStyle(copyElement).gridColumnStart,
          shellWidth: shell.width,
          mediaSpan: getComputedStyle(mediaElement).gridColumnStart,
          mediaRatio: visual.width / visual.height,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
    };

    const cinematic = await geometry('?hero=a');
    expect(cinematic.copySpan).toBe('1');
    expect(Math.abs(cinematic.shellWidth - cinematic.viewportWidth)).toBeLessThan(3);
    expect(cinematic.media.width / cinematic.viewportWidth).toBeGreaterThan(0.98);
    expect(cinematic.media.x).toBeLessThanOrEqual(2);
    expect(cinematic.media.y).toBeLessThan(4);
    expect(Math.abs(cinematic.media.right - cinematic.viewportWidth)).toBeLessThan(3);
    expect(cinematic.media.height).toBeGreaterThan(420);
    expect(cinematic.copy.y + cinematic.copy.height).toBeLessThanOrEqual(cinematic.media.y + cinematic.media.height + 2);
    expect(cinematic.overflow).toBe(0);

    const editorial = await geometry('?hero=b');
    expect(editorial.copySpan).toBe('span 5');
    expect(editorial.mediaSpan).toBe('span 7');
    expect(
      Math.abs(
        editorial.media.y + editorial.media.height / 2
        - (editorial.copy.y + editorial.copy.height / 2),
      ),
    ).toBeLessThan(3);
    expect(Math.abs(editorial.mediaRatio - 16 / 9)).toBeLessThan(0.01);
    expect(editorial.overflow).toBe(0);

    const gallery = await geometry('?hero=c');
    expect(Math.abs(gallery.media.width - gallery.shell.width)).toBeLessThan(3);
    expect(gallery.media.y).toBeGreaterThan(gallery.copy.y + gallery.copy.height);
    expect(Math.abs(gallery.mediaRatio - 16 / 9)).toBeLessThan(0.01);
    expect(gallery.overflow).toBe(0);

    for (const width of [768, 1099]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ['b', 'c']) {
        const stacked = await geometry(`?hero=${name}`);
        expect(stacked.media.y).toBeGreaterThan(stacked.copy.y + stacked.copy.height);
        expect(Math.abs(stacked.media.width - stacked.shell.width)).toBeLessThan(3);
        expect(stacked.overflow).toBe(0);
      }

      const overlayMobile = await geometry('?hero=a');
      expect(overlayMobile.media.width / overlayMobile.viewportWidth).toBeGreaterThan(0.98);
      expect(overlayMobile.overflow).toBe(0);
    }

    await page.setViewportSize({ width: 1100, height: 900 });
    const splitAtBreakpoint = await geometry('?hero=a');
    expect(splitAtBreakpoint.copySpan).toBe('1');
    expect(splitAtBreakpoint.media.width / splitAtBreakpoint.viewportWidth).toBeGreaterThan(0.98);
    expect(Math.abs(splitAtBreakpoint.media.right - splitAtBreakpoint.viewportWidth)).toBeLessThan(3);
    expect(splitAtBreakpoint.media.height).toBeGreaterThan(420);

    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const name of ['a', 'b', 'c']) {
      const desktop = await geometry(`?hero=${name}`);
      expect(desktop.overflow).toBe(0);
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
    const wide = await geometry('?hero=a');
    expect(wide.media.width / wide.viewportWidth).toBeGreaterThan(0.98);
    expect(wide.media.x).toBeLessThanOrEqual(2);
    expect(Math.abs(wide.media.right - wide.viewportWidth)).toBeLessThan(3);

    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of ['b', 'c']) {
      const mobile = await geometry(`?hero=${name}`);
      expect(mobile.media.y).toBeGreaterThan(mobile.copy.y + mobile.copy.height);
      expect(Math.abs(mobile.media.width - mobile.shell.width)).toBeLessThan(3);
      expect(mobile.overflow).toBe(0);
    }

    // The overlay hero keeps its copy on top of a full-screen video on phones too
    const overlayPhone = await geometry('?hero=a');
    expect(overlayPhone.media.y).toBeLessThan(4);
    expect(overlayPhone.media.width / overlayPhone.viewportWidth).toBeGreaterThan(0.98);
    expect(overlayPhone.copy.y + overlayPhone.copy.height).toBeLessThanOrEqual(overlayPhone.media.y + overlayPhone.media.height + 2);
    expect(overlayPhone.overflow).toBe(0);
  });
});
