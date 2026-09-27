import { avifSrcSet, avifUrl } from '../../data/siteData';

function mosaicRows(images, size) {
  const rows = [];

  for (let index = 0; index < images.length; index += size) {
    rows.push(images.slice(index, index + size));
  }

  return rows;
}

function MosaicTile({ image, imageIndex, startIndex, onOpenLightbox, isHero }) {
  return (
    <button
      type="button"
      className={isHero ? 'portfolio-mosaic-tile portfolio-mosaic-tile-hero' : 'portfolio-mosaic-tile'}
      onClick={() => onOpenLightbox(startIndex + imageIndex)}
      aria-label={`Ampliar ${image.alt}`}
    >
      <picture>
        <source
          type="image/avif"
          srcSet={image.srcSet ? avifSrcSet(image.srcSet) : avifUrl(image.src)}
          sizes={image.sizes}
        />
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.sizes}
          alt={image.alt}
          width={image.width}
          height={image.height}
          style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <span className="portfolio-mosaic-tile-hint" aria-hidden="true">Ampliar</span>
    </button>
  );
}

// Every tile in a row gets the same size. Using the average ratio keeps the row
// as tall as the photos laid out at their natural shapes, so the columns stay balanced.
function MosaicRow({ images, firstIndex, startIndex, onOpenLightbox }) {
  const rowRatio = images.reduce((sum, image) => sum + image.ratio, 0) / images.length;

  return (
    <div className="portfolio-mosaic-row" style={{ '--row-ratio': rowRatio }}>
      {images.map((image, imageIndex) => (
        <MosaicTile
          key={image.src}
          image={image}
          imageIndex={firstIndex + imageIndex}
          startIndex={startIndex}
          onOpenLightbox={onOpenLightbox}
        />
      ))}
    </div>
  );
}

export default function ProjectMosaic({ project, categoryLabel, startIndex, onOpenLightbox }) {
  const { images } = project;

  let content = null;

  if (project.layout === 'grid') {
    content = (
      <div className="portfolio-mosaic-grid">
        {images.map((image, imageIndex) => (
          <MosaicTile
            key={image.src}
            image={image}
            imageIndex={imageIndex}
            startIndex={startIndex}
            onOpenLightbox={onOpenLightbox}
          />
        ))}
      </div>
    );
  } else if (project.layout === 'pairs') {
    content = mosaicRows(images, 2).map((row, rowIndex) => (
      <MosaicRow
        key={row[0].src}
        images={row}
        firstIndex={rowIndex * 2}
        startIndex={startIndex}
        onOpenLightbox={onOpenLightbox}
      />
    ));
  } else if (images.length === 1) {
    content = (
      <MosaicTile
        image={images[0]}
        imageIndex={0}
        startIndex={startIndex}
        onOpenLightbox={onOpenLightbox}
      />
    );
  } else if (images.length === 2) {
    content = (
      <MosaicRow images={images} firstIndex={0} startIndex={startIndex} onOpenLightbox={onOpenLightbox} />
    );
  } else {
    const [hero, ...rest] = images;
    // Keep the leftover photos on a single row so a tall orphan does not
    // drop below the neighboring column.
    const rowSize = images.length >= 5 || rest.length === 3 ? 3 : 2;

    content = (
      <div className="portfolio-mosaic-cluster">
        <MosaicTile
          image={hero}
          imageIndex={0}
          startIndex={startIndex}
          onOpenLightbox={onOpenLightbox}
          isHero
        />
        {mosaicRows(rest, rowSize).map((row, rowIndex) => (
          <MosaicRow
            key={row[0].src}
            images={row}
            firstIndex={rowIndex * rowSize + 1}
            startIndex={startIndex}
            onOpenLightbox={onOpenLightbox}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="portfolio-mosaic-group" data-category={categoryLabel}>
      {content}
    </div>
  );
}
