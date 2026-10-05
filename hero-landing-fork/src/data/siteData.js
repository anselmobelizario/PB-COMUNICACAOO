import { buildWhatsAppLink } from '../utils/whatsapp';
import galleryImageRatios from './galleryImageRatios.json';
import assetVersions from './assetVersions.json';

const WHATSAPP_PHONE = '5511965698725';

const DEFAULT_WHATSAPP_MESSAGE =
  'Olá, P&B Comunicação Visual! Cheguei aqui pelo site e gostaria de solicitar um orçamento de comunicação visual (adesivação de veículos, adesivação geral, banner/lona ou PDV). Podem me passar as informações?';

function buildWhatsAppUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return buildWhatsAppLink(WHATSAPP_PHONE, message);
}

const FALLBACK_RATIO = 4 / 3;

// /assets is served as immutable and replaced photos keep their names, so every gallery
// URL carries the content hash from the manifest (npm run generate-gallery-ratios).
const withVersion = (url, version) => (version ? `${url}?v=${version}` : url);

export const galleryUrl = (path) => withVersion(path, galleryImageRatios[path]?.v);

// Same idea as galleryUrl for the stable-named assets outside the gallery
// manifest (npm run generate-asset-versions). Production posters that live in
// the gallery folder still resolve: they keep their entry in
// galleryImageRatios.
export const assetUrl = (path) => withVersion(path, assetVersions[path] ?? galleryImageRatios[path]?.v);

export const assetSrcSet = (srcSet) => srcSet
  ?.split(', ')
  .map((entry) => {
    const [url, ...descriptors] = entry.split(' ');
    return [assetUrl(url), ...descriptors].join(' ');
  })
  .join(', ');

// AVIF twins are generated next to the source images (npm run generate-avif)
// and share their ?v= version. Accepts both the raw and the already-versioned
// URL so call sites can pass whatever they already hold.
export const avifUrl = (path) => {
  const [bare] = path.split('?');
  if (!/\.(webp|jpe?g)$/i.test(bare)) return undefined;
  const version = assetVersions[bare] ?? galleryImageRatios[bare]?.v;
  return version ? `${bare.replace(/\.(webp|jpe?g)$/i, '.avif')}?v=${version}` : undefined;
};

export const avifSrcSet = (srcSet) => {
  if (!srcSet) return undefined;
  const candidates = srcSet
    .split(', ')
    .map((entry) => {
      const [url, ...descriptors] = entry.split(' ');
      const avif = avifUrl(url);
      return avif ? [avif, ...descriptors].join(' ') : null;
    })
    .filter(Boolean);
  return candidates.length ? candidates.join(', ') : undefined;
};

export const gallerySrcSet = (path) => {
  const meta = galleryImageRatios[path];
  if (!meta || meta.width <= 800) return undefined;
  const variant = (size) => withVersion(path.replace('.webp', `-${size}.webp`), meta.v);
  return `${variant(480)} 480w, ${variant(800)} 800w, ${galleryUrl(path)} ${meta.width}w`;
};

const galleryImage = (folder, file, alt, objectPosition) => {
  const path = `/assets/gallery/${folder}/${file}.webp`;
  const meta = galleryImageRatios[path];

  return {
    src: galleryUrl(path),
    srcSet: gallerySrcSet(path),
    sizes: '(max-width: 767px) 92vw, 30vw',
    alt,
    width: meta?.width ?? 800,
    height: meta?.height ?? 600,
    ratio: meta ? meta.width / meta.height : FALLBACK_RATIO,
    objectPosition,
  };
};

// layout: 'grid' is an even 2x2 collage of square tiles; 'pairs' puts two photos per row.
const project = (id, category, title, images, layout) => ({ id, category, title, images, layout });

export const siteData = {
  company: {
    name: 'P&B Comunicação Visual',
    founded: 2002,
    description:
      'Desde 2002 desenvolvemos projetos de comunicação visual, impressão, produção e instalação para tornar marcas cada vez mais visíveis e próximas de seus clientes.',
    logoSrc: '/assets/logo.webp',
    logoWidth: 480,
    logoHeight: 346,
  },

  contact: {
    address: 'Rua Antonio Raposo, 149, Lapa, São Paulo - SP',
    cep: 'CEP 05074-020',
    addressHint: 'Próximo à estação de Trem Lapa, travessa com a 12 de Outubro',
    phones: '(11) 3836-0196 / 3644-8907',
    phoneLink: 'tel:+551138360196',
    phone2: '3644-8907',
    phoneLink2: 'tel:+551136448907',
    email: 'vendas1@pbcomunicacao.com.br',
    whatsappPhone: WHATSAPP_PHONE,
    whatsappUrl: buildWhatsAppUrl(),
    location: {
      lat: -23.5213003,
      lng: -46.7062256,
      zoom: 16,
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-23.5213003,-46.7062256',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=-23.5213003,-46.7062256',
      embedUrl:
        'https://www.google.com/maps?q=-23.5213003,-46.7062256&hl=pt-BR&z=16&output=embed',
    },
  },

  social: [
    {
      platform: 'Facebook',
      href: 'https://www.facebook.com/PBComunicacao/',
      icon: 'facebook',
    },
    {
      platform: 'Instagram',
      href: 'https://www.instagram.com/pb.comunicacaovisual/',
      icon: 'instagram',
    },
  ],

  nav: {
    links: [
      { label: 'Serviços', href: '#servicos' },
      { label: 'Portfólio', href: '#portfolio' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contato', href: '#contato' },
    ],
    mobileMenuCloseLabel: 'Fechar menu',
  },

  hero: {
    headline: '24 anos.',
    highlight: 'Causando impacto.',
    intro: {
      mark: 'Somos',
      text: 'a P&B Comunicação Visual.',
    },
    subheadline: [
      'Desde 2002, tornamos marcas mais visíveis, próximas e admiradas.',
      'Entregamos comunicação visual completa: impressão, acabamento e instalação com padrão.',
      'Agilidade máxima e compromisso absoluto.',
    ],
    video: {
      poster: '/assets/hero/hero-video-02-poster-1280.webp',
      posterSrcSet: '/assets/hero/hero-video-02-poster-640.webp 640w, /assets/hero/hero-video-02-poster-960.webp 960w, /assets/hero/hero-video-02-poster-1280.webp 1280w',
      // The clip is shot upright: portrait screens get it as is, wider ones a 16:9
      // cut with the clip sharp on the right over a blurred fill of itself.
      sources: [
        { src: '/assets/hero/hero-video-02-portrait.mp4', type: 'video/mp4', media: '(max-aspect-ratio: 1/1)' },
        { src: '/assets/hero/hero-video-02.mp4', type: 'video/mp4' },
      ],
    },
  },

  clients: {
    label: 'Clientes',
    logos: [
      { name: 'JBS', src: '/assets/clients/jbs-1.jpg' },
      { name: 'Mapfre', src: '/assets/clients/mapfre.jpg' },
      { name: 'Mahogany', src: '/assets/clients/mahogany.jpg' },
      { name: 'Sabesp', src: '/assets/clients/sabesp.jpg' },
      { name: 'Seara', src: '/assets/clients/seara-1.jpg' },
      { name: 'Vigor', src: '/assets/clients/vigor-1.jpg' },
      { name: 'Friboi', src: '/assets/clients/friboi-1.jpg' },
      { name: 'Viveo', src: '/assets/clients/viveo.jpg' },
      { name: 'Swift', src: '/assets/clients/swift-1.jpg' },
      { name: 'Hinode', src: '/assets/clients/hinode.jpg' },
      { name: 'Açovisa', src: '/assets/clients/acovisa.jpg' },
      { name: 'Auto Glass', src: '/assets/clients/auto-glass.jpg' },
      { name: 'EDP Energia', src: '/assets/clients/edp.jpg' },
      { name: 'Sonda', src: '/assets/clients/sonda.webp' },
      { name: 'Adias', src: '/assets/clients/adias.webp' },
    ],
  },

  process: {
    label: 'Nosso Processo',
    headline: {
      before: 'Do ',
      accent: 'Briefing',
      after: ' à Instalação',
    },
    subheadline:
      'Do primeiro alinhamento à instalação, cada etapa é conduzida com clareza, cuidado e padrão de entrega.',
    steps: [
      {
        num: '01',
        icon: 'clipboard',
        title: 'Analisamos seu projeto',
        description:
          'Levantamento técnico completo e alinhamento com o manual da sua marca para garantir fidelidade total ao padrão.',
      },
      {
        num: '02',
        icon: 'printer',
        title: 'Produzimos com rigor',
        description:
          'Impressão em alta resolução e acabamento, com controle de qualidade.',
      },
      {
        num: '03',
        icon: 'truck',
        title: 'Instalação Nacional Segura',
        description:
          'Equipes especializadas para instalação em todo o território brasileiro. Logística coordenada com mínima interferência na operação do cliente.',
      },
    ],
  },

  materials: {
    label: 'Materiais e aplicações',
    headline: {
      before: 'Materiais que dão forma',
      accent: 'à sua marca',
    },
    subheadline:
      'Escolhemos cada solução pela qualidade da aplicação, pela leitura da marca e pelo resultado no ambiente.',
    videos: [
      {
        id: 'jbs-fazer-o-bem',
        label: 'Adesivação de frota',
        src: '/assets/materials/jbs-fazer-o-bem.mp4',
        poster: '/assets/materials/jbs-fazer-o-bem-poster.jpg',
        alt: 'Carreta JBS Fazer o Bem com adesivação completa de baú',
        width: 480,
        height: 848,
      },
      {
        id: 'elevador',
        label: 'Adesivação de elevador',
        src: '/assets/materials/elevador.mp4',
        poster: '/assets/materials/elevador-poster.jpg',
        alt: 'Elevador com adesivação de marca aplicada nas portas',
        width: 480,
        height: 848,
      },
      {
        id: 'frota-pickups-galpao',
        label: 'Frota adesivada',
        src: '/assets/materials/frota-pickups-galpao.mp4',
        poster: '/assets/materials/frota-pickups-galpao-poster.jpg',
        alt: 'Frota de pickups brancos com adesivação colorida em galpão',
        width: 478,
        height: 850,
      },
    ],
  },

  services: {
    label: 'Soluções P&B',
    headline: {
      before: 'Comunicação visual',
      accent: 'completa',
    },
    subheadline:
      'Do veículo ao ponto de venda, reunimos produção, acabamento e instalação para dar consistência à presença da sua marca.',
    ctaText: 'Ver projetos desta categoria',
    items: [
      {
        title: 'Adesivação de Veículos',
        description: 'Adesivação de carros, vans e frotas com aplicação precisa, acabamento limpo e identidade alinhada à sua marca.',
        specs: ['Carros', 'Vans', 'Caminhões', 'Carretas', 'Ônibus', 'Frotas'],
        image: '/assets/gallery/veiculos/veiculo-22.webp',
        gallery: [
          '/assets/gallery/veiculos/veiculo-22.webp',
          '/assets/gallery/frota/frota-02.webp',
          { src: '/assets/gallery/veiculos/veiculo-20.webp', objectPosition: 'center 45%' },
          '/assets/gallery/frota/frota-10.webp',
          '/assets/gallery/veiculos/veiculo-06.webp',
        ],
        category: 'Adesivação de veículos',
        metric: 'Sua marca em movimento todos os dias',
        icon: 'vehicle',
      },
      {
        title: 'Adesivação Geral',
        description:
          'Adesivação em geral, com verniz e laminado adequado para qualquer superfície lisa: pisos, vidros, paredes, madeiras, elevadores e geladeiras/freezers.',
        specs: ['Pisos', 'Vidros', 'Paredes', 'Madeiras', 'Elevadores', 'Geladeiras / Freezers'],
        image: {
          src: '/assets/gallery/fachadas/fachadas-04.webp',
          objectPosition: 'center 35%',
        },
        gallery: [
          { src: '/assets/gallery/fachadas/fachadas-04.webp', objectPosition: 'center 35%' },
          { src: '/assets/gallery/paineis/adias-mural.webp', objectPosition: 'center 40%' },
          { src: '/assets/gallery/paineis/paineis-02.webp', objectPosition: 'center 42%' },
          { src: '/assets/gallery/paineis/painel-03.webp', objectPosition: 'center 68%' },
          { src: '/assets/gallery/fachadas/fachadas-05.webp', objectPosition: 'center 25%' },
          { src: '/assets/gallery/paineis/painel-13.webp', objectPosition: 'center 38%' },
          { src: '/assets/gallery/paineis/painel-11.webp', objectPosition: 'center 30%' },
          '/assets/gallery/fachadas/fachadas-06.webp',
        ],
        category: 'Adesivação geral',
        metric: 'Ambientes mais claros, consistentes e memoráveis',
        icon: 'general',
      },
      {
        title: 'Banner / Lona',
        description: 'Impressão de grande formato para campanhas, fachadas, eventos e comunicações que precisam aparecer.',
        image: {
          src: '/assets/gallery/banners/banner-01.webp',
          objectPosition: 'center 28%',
        },
        gallery: [
          { src: '/assets/gallery/banners/banner-01.webp', objectPosition: 'center 28%' },
          { src: '/assets/gallery/banners/banner-03.webp', objectPosition: 'center top' },
          { src: '/assets/gallery/banners/banner-06.webp', objectFit: 'contain' },
          { src: '/assets/gallery/banners/banner-07.webp', objectFit: 'contain' },
          { src: '/assets/gallery/banners/banner-10.webp', objectFit: 'contain' },
        ],
        specs: ['Bastão de madeira', 'Alumínio', 'Ilhós', 'Pedestais', 'Roll-up'],
        category: 'Banner / Lona',
        metric: 'Comunicação de alto impacto em grande escala',
        icon: 'banner',
      },
      {
        title: 'PDVs e materiais diversos',
        description: 'Materiais para destacar produtos, orientar jornadas e deixar a experiência da marca mais presente no ponto de venda.',
        image: {
          src: '/assets/gallery/pdv/pocoyo-standee.webp',
          objectFit: 'contain',
        },
        gallery: [
          { src: '/assets/gallery/pdv/pocoyo-standee.webp', objectFit: 'contain' },
          { src: '/assets/gallery/pdv/primor-pdv.webp', objectPosition: 'center 48%' },
          { src: '/assets/gallery/pdv/montana-pdv.webp', objectFit: 'contain' },
          { src: '/assets/gallery/pdv/kitkat-pdv.webp', objectPosition: 'center 40%' },
          { src: '/assets/gallery/pdv/friboi-banners.webp', objectPosition: 'center 40%' },
          { src: '/assets/gallery/pdv/seara-fatiador.webp', objectPosition: 'center 45%' },
          { src: '/assets/gallery/paineis/paineis-07.webp', objectFit: 'contain' },
        ],
        specs: [
          'Tag',
          'Totem',
          'Móbile',
          'Display',
          'Stopper',
          'Wobbler',
          'Letra bloco',
          'Faixa de gôndola',
          'Manta magnética',
        ],
        category: 'PDVs e materiais diversos',
        metric: 'Mais presença no momento da decisão',
        icon: 'pdv',
      },
    ],
  },

  portfolio: {
    title: 'Portfólio',
    subheadline:
      'Trabalhos reais de adesivação, impressão e materiais que colocam marcas em movimento.',
    categories: [
      { id: 'vehicles', label: 'Adesivação de veículos' },
      { id: 'general', label: 'Adesivação geral' },
      { id: 'banner', label: 'Banner / Lona' },
      { id: 'pdv', label: 'PDVs e materiais diversos' },
      { id: 'producao', label: 'Essência P&B', videoOnly: true },
    ],
    projects: [
      project('vehicle-seara-truck', 'vehicles', 'Seara', [
        galleryImage('veiculos', 'veiculo-22', 'Caminhão Seara adesivado'),
      ]),
      project('vehicle-xando', 'vehicles', 'Xandô', [
        galleryImage('veiculos', 'veiculo-27', 'Caminhão baú Xandô adesivado em vista traseira', 'center 50%'),
        galleryImage('veiculos', 'veiculo-28', 'Caminhão baú Xandô adesivado em vista lateral', 'center 37%'),
        galleryImage('veiculos', 'veiculo-29', 'Caminhão Xandô com logotipo adesivado no capô', 'center 40%'),
        galleryImage('veiculos', 'veiculo-30', 'Caminhão baú Xandô adesivado no outro lado', 'center 50%'),
      ], 'grid'),
      project('vehicle-seara', 'vehicles', 'Seara', [
        galleryImage('frota', 'frota-08', 'Veículo Seara adesivado'),
        galleryImage('frota', 'frota-12', 'Veículo Seara em outro ângulo'),
      ]),
      project('vehicle-sabesp-frota', 'vehicles', 'Sabesp', [
        galleryImage('frota', 'frota-15', 'Picape Sabesp adesivada em vista lateral'),
        galleryImage('frota', 'frota-13', 'Picape Sabesp adesivada em vista frontal'),
        galleryImage('frota', 'frota-17', 'Picape Sabesp adesivada em vista traseira'),
      ]),
      // Landscape shots share the top row and portrait shots the bottom one, so no photo is cropped.
      project('vehicle-sabesp', 'vehicles', 'Sabesp', [
        galleryImage('veiculos', 'veiculo-23', 'Van Sabesp adesivada em vista lateral'),
        galleryImage('veiculos', 'veiculo-26', 'Van Sabesp adesivada em outro ângulo'),
        galleryImage('veiculos', 'veiculo-24', 'Van Sabesp adesivada em vista traseira'),
        galleryImage('veiculos', 'veiculo-25', 'Van Sabesp adesivada em vista frontal'),
      ], 'pairs'),
      project('vehicle-nocarbon', 'vehicles', 'NoCarbon', [
        galleryImage('veiculos', 'veiculo-16', 'Veículo NoCarbon adesivado'),
        galleryImage('frota', 'frota-02', 'Caminhão NoCarbon adesivado'),
        galleryImage('frota', 'frota-04', 'Caminhão NoCarbon em outro ângulo'),
      ]),
      project('vehicle-roadstar', 'vehicles', 'Roadstar', [
        galleryImage('veiculos', 'veiculo-05', 'Carro Roadstar com comunicação visual aplicada'),
      ]),
      project('vehicle-louv-clean', 'vehicles', 'Louv Clean', [
        galleryImage('veiculos', 'veiculo-02', 'Veículo Louv Clean personalizado com aplicação gráfica'),
      ]),
      project('vehicle-cef-distribuidora', 'vehicles', 'C&F Distribuidora', [
        galleryImage('veiculos', 'veiculo-04', 'Caminhão C&F Distribuidora com adesivação de alta performance'),
      ]),
      project('vehicle-auto-glass', 'vehicles', 'Auto Glass', [
        galleryImage('veiculos', 'veiculo-11', 'Veículo Auto Glass adesivado em vista lateral'),
        galleryImage('veiculos', 'veiculo-12', 'Veículo Auto Glass adesivado em outro ângulo'),
      ]),
      project('vehicle-swift', 'vehicles', 'Swift', [
        galleryImage('veiculos', 'veiculo-14', 'Veículo Swift e Degusta adesivado'),
        galleryImage('frota', 'frota-18', 'Veículo Swift de frota em campo'),
      ]),
      project('vehicle-friboi', 'vehicles', 'Friboi', [
        galleryImage('veiculos', 'veiculo-06', 'Veículo Friboi adesivado em vista lateral'),
        galleryImage('veiculos', 'veiculo-07', 'Veículo Friboi adesivado em outro ângulo'),
        galleryImage('veiculos', 'veiculo-08', 'Detalhe da adesivação Friboi'),
      ]),
      project('vehicle-torra', 'vehicles', 'Torra', [
        galleryImage('veiculos', 'veiculo-13', 'Veículo Torra adesivado'),
        galleryImage('frota', 'frota-11', 'Veículo Torra de frota em campo'),
      ]),
      project('vehicle-correios', 'vehicles', 'Correios', [
        galleryImage('frota', 'frota-06', 'Van Correios adesivada com campanha "A vida segue"'),
      ]),
      project('vehicle-uol', 'vehicles', 'UOL', [
        galleryImage('frota', 'frota-09', 'Veículo UOL adesivado'),
      ]),
      project('vehicle-cartao-todos', 'vehicles', 'Cartão de TODOS / Rio de Prêmios', [
        galleryImage('veiculos', 'veiculo-17', 'Veículo Cartão de TODOS adesivado'),
        galleryImage('veiculos', 'veiculo-20', 'Veículo Rio de Prêmios adesivado'),
      ]),
      project('vehicle-italakinho', 'vehicles', 'Italakinho', [
        galleryImage('veiculos', 'veiculo-31', 'Van Italakinho adesivada em vista lateral'),
        galleryImage('veiculos', 'veiculo-32', 'Van Italakinho adesivada em vista traseira'),
      ]),
      project('vehicle-smart-fit', 'vehicles', 'Smart Fit', [
        galleryImage('frota', 'frota-16', 'Smart Truck Smart Fit adesivado'),
        galleryImage('veiculos', 'veiculo-09', 'Smart Truck Smart Fit amarelo com o Cristo Redentor'),
      ]),
      project('vehicle-instituto-taupet', 'vehicles', 'Instituto Taupet', [
        galleryImage('veiculos', 'veiculo-03', 'Van Instituto Taupet personalizada com identidade visual'),
      ]),
      project('vehicle-attos-rh', 'vehicles', 'Attos RH', [
        galleryImage('veiculos', 'veiculo-10', 'Veículo Attos RH personalizado com identidade visual'),
      ]),
      project('vehicle-vigor', 'vehicles', 'Vigor', [
        galleryImage('veiculos', 'veiculo-15', 'Veículo Vigor adesivado'),
        galleryImage('frota', 'frota-05', 'Veículo Vigor de frota em campo'),
      ]),
      project('vehicle-edp', 'vehicles', 'EDP Energia', [
        galleryImage('frota', 'frota-10', 'Veículo EDP Energia adesivado'),
      ]),

      project('general-future-intelbras', 'general', 'Future Intelbras', [
        galleryImage('paineis', 'painel-14', 'Adesivação de parede Future Intelbras'),
      ]),
      project('general-jbs-mural', 'general', 'JBS', [
        galleryImage('paineis', 'painel-03', 'Mural JBS com arquitetura de marcas em parede'),
        galleryImage('paineis', 'paineis-13', 'Parede corporativa com adesivação de marcas JBS'),
      ]),
      project('general-vigor-expositor', 'general', 'Vigor', [
        galleryImage('paineis', 'paineis-21', 'Adesivação de expositor refrigerado VIGOR Grego Gourmet'),
      ]),
      project('general-delicia', 'general', 'Delícia', [
        galleryImage('paineis', 'paineis-04', 'Adesivação de parede Delícia em ambiente interno'),
      ]),
      project('general-jbs-facade', 'general', 'JBS', [
        galleryImage('fachadas', 'fachadas-06', 'Fachada JBS com comunicação visual'),
      ]),
      project('general-johnnie-walker', 'general', 'Johnnie Walker', [
        galleryImage('paineis', 'paineis-22', 'Geladeira Johnnie Walker adesivada com frase da marca'),
      ]),
      project('general-totens-diversos', 'general', 'Totens diversos', [
        galleryImage('paineis', 'paineis-14', 'Totens Seara e JBS em ambiente corporativo'),
      ]),
      project('general-unhas-cariocas', 'general', 'Unhas Cariocas', [
        galleryImage('paineis', 'paineis-17', 'Adesivação Unhas Cariocas em portas de banheiro comercial'),
      ]),
      project('general-vb-salao', 'general', 'VB Salão de Beleza', [
        galleryImage('paineis', 'painel-11', 'Painel luminoso VB Salão de Beleza'),
      ]),
      project('general-seara-marcas', 'general', 'Seara', [
        galleryImage('totens', 'totens-05', 'Totem de sinalização com marcas Seara'),
      ]),
      project('general-gregario', 'general', 'Gregario', [
        galleryImage('paineis', 'painel-16', 'Painel Gregario Cycling em mídia externa'),
      ]),
      project('general-jbs-65-anos', 'general', 'JBS', [
        galleryImage('paineis', 'painel-10', 'Painel JBS 65 anos'),
      ]),
      project('general-viveo', 'general', 'Viveo', [
        galleryImage('paineis', 'paineis-23', 'Mural corporativo Viveo com cadeia de suprimentos em escritório'),
      ]),
      project('general-gregario-comemorativo', 'general', 'Gregario', [
        galleryImage('paineis', 'painel-05', 'Painel Gregario Cycling comemorativo'),
      ]),
      project('general-seara-porta', 'general', 'Seara', [
        galleryImage('paineis', 'paineis-20', 'Adesivação em porta de vidro da unidade Seara de Osasco'),
      ]),
      project('general-vigor-logo', 'general', 'Vigor', [
        galleryImage('paineis', 'paineis-02', 'Adesivação de parede com logotipo Vigor'),
      ]),
      project('general-lactalis', 'general', 'Lactalis', [
        galleryImage('paineis', 'paineis-08', 'Adesivação de parede Lactalis em sala corporativa'),
      ]),
      project('general-parque-bruno-covas-acesso', 'general', 'Parque Bruno Covas', [
        galleryImage('totens', 'totens-03', 'Totem Santander Parque Bruno Covas de entrada de veículos'),
      ]),
      project('general-sanfra-kids', 'general', 'Sanfra Kids', [
        galleryImage('paineis', 'paineis-09', 'Adesivação de parede Ludoteca Sanfra Kids em ambiente infantil'),
      ]),
      project('general-acougue', 'general', 'Açougue', [
        galleryImage('paineis', 'paineis-24', 'Adesivação de freezers do açougue em supermercado'),
      ]),
      project('general-jbs-parede', 'general', 'JBS', [
        galleryImage('paineis', 'painel-01', 'Adesivação de parede JBS em ambiente corporativo'),
      ]),
      project('general-parque-global', 'general', 'Parque Global', [
        galleryImage('totens', 'totens-04', 'Totem de sinalização Parque Global'),
      ]),
      project('general-bonafont', 'general', 'Bonafont', [
        galleryImage('paineis', 'painel-09', 'Fachada adesivada Bonafont'),
      ]),
      project('general-bis', 'general', 'BIS', [
        galleryImage('paineis', 'paineis-19', 'Adesivação de piso BIS em corredor de supermercado'),
      ]),
      project('general-mahogany', 'general', 'Mahogany', [
        galleryImage('fachadas', 'fachadas-05', 'Vitrine Mahogany em shopping'),
      ]),
      project('general-soul-brasileira', 'general', 'Soul Brasileira', [
        galleryImage('paineis', 'paineis-15', 'Adesivação de parede Soul Brasileira'),
      ]),
      project('general-prime-comfort', 'general', 'Prime Comfort', [
        galleryImage('paineis', 'painel-12-b', 'Fachada Prime Comfort com adesivação de parede'),
      ]),
      project('general-hope', 'general', 'Hope', [
        galleryImage('paineis', 'paineis-11-b', 'Painel Hope em circulação de shopping'),
      ]),
      project('general-nescau', 'general', 'Nescau', [
        galleryImage('banners', 'banners-05', 'Adesivação em escada rolante Nescau'),
      ]),
      project('general-mma-octagon', 'general', 'Krew Krew', [
        galleryImage('paineis', 'paineis-16', 'Adesivação de octógono de MMA Krew Krew'),
      ]),
      project('general-jbs-evento', 'general', 'JBS', [
        galleryImage('paineis', 'painel-06', 'Painel JBS para evento corporativo'),
      ]),
      project('general-swift-klabin', 'general', 'Swift', [
        galleryImage('fachadas', 'fachadas-04', 'Fachada Swift Cambuci com comunicação visual'),
      ]),
      project('general-batavo', 'general', 'Batavo', [
        galleryImage('banners', 'banners-06', 'Adesivação de porta de elevador Batavo'),
      ]),
      project('general-jbs-paineis', 'general', 'JBS', [
        galleryImage('paineis', 'paineis-12', 'Painel corporativo JBS em recepção'),
      ]),
      project('general-hinode', 'general', 'Hinode', [
        galleryImage('paineis', 'paineis-05', 'Adesivação Hinode em ambiente interno'),
      ]),
      project('general-samsung', 'general', 'Samsung', [
        galleryImage('paineis', 'painel-13', 'Material Samsung em ponto de venda'),
      ]),
      project('general-parque-bruno-covas', 'general', 'Parque Bruno Covas', [
        galleryImage('totens', 'totens-01', 'Totem Santander Parque Bruno Covas de sinalização esportiva'),
        galleryImage('totens', 'totens-07', 'Totem Santander Parque Bruno Covas de entrada de veículos'),
      ]),
      project('general-mural-pdv', 'general', 'Mural corporativo', [
        galleryImage(
          'paineis',
          'adias-mural',
          'Mural corporativo Adias com logo iluminado e frase Seu sucesso é o nosso compromisso',
        ),
      ]),

      project('banner-contax-nespresso', 'banner', 'Contax / Nespresso', [
        galleryImage('banners', 'banner-01', 'Banner Training Day Contax e Nespresso'),
      ]),
      project('banner-brinde-a-vida', 'banner', 'Brinde à Vida', [
        galleryImage('banners', 'banner-02b', 'Banner Brinde à vida'),
      ]),
      project('banner-korin', 'banner', 'Korin', [
        galleryImage('banners', 'banner-03', 'Banner Korin Agricultura Natural'),
      ]),
      project('banner-la-fleur-lepine', 'banner', 'La Fleur / L’Epine', [
        galleryImage('banners', 'banner-04', 'Banner La Fleur e L’Epine'),
      ]),
      project('banner-feira-carandai', 'banner', 'Feira de Comida Carandaí', [
        galleryImage('banners', 'banner-08c', 'Banner Feira de Comida Carandaí'),
      ]),
      project('banner-backdrop-corporativo', 'banner', 'Backdrop corporativo', [
        galleryImage('banners', 'banner-05', 'Backdrop com logos corporativos'),
      ]),
      project('banner-seara-gourmet', 'banner', 'Seara Gourmet', [
        galleryImage('banners', 'banner-10', 'Banner Seara Gourmet'),
      ]),
      project('banner-big-x-picanha', 'banner', 'Big X Picanha', [
        galleryImage('banners', 'banner-06', 'Banner Big X Picanha'),
      ]),
      project('banner-santander', 'banner', 'Santander', [
        galleryImage('paineis', 'painel-04b', 'Painel Santander em mídia externa'),
      ]),
      project('banner-jabra', 'banner', 'Jabra Evolve', [
        galleryImage('banners', 'banner-09', 'Banner Jabra Evolve'),
      ]),
      project('banner-swift-carrefour', 'banner', 'Swift', [
        galleryImage('paineis', 'painel-15', 'Painel Swift reinauguração Carrefour'),
      ]),
      project('banner-palmolive', 'banner', 'Palmolive Amazônia', [
        galleryImage('banners', 'banner-07', 'Banner Palmolive Amazônia'),
      ]),
      project('banner-santander-bruno-covas', 'banner', 'Santander', [
        galleryImage('totens', 'totens-06', 'Painel Santander Parque Bruno Covas com início das obras'),
      ]),
      project('banner-media-externa', 'banner', 'Painel em mídia externa', [
        galleryImage('paineis', 'painel-08', 'Painel em mídia externa'),
      ]),

      project('pdv-emily-in-paris', 'pdv', 'Emily in Paris', [
        galleryImage('banners', 'banners-04', 'Display promocional Emily in Paris em ponto de venda'),
      ]),
      project('pdv-hinode-aplicacao', 'pdv', 'Hinode', [
        galleryImage('paineis', 'paineis-10', 'Aplicação Hinode em ponto de venda'),
      ]),
      project('pdv-pocoyo', 'pdv', 'Pocoyo', [
        galleryImage(
          'pdv',
          'pocoyo-standee',
          'Totem promocional personalizado do personagem Pocoyo em vermelho, com boné escrito Sextou e segurando um emoji verde de carinha feliz, posicionado em ambiente interno',
        ),
      ]),
      project('pdv-prudential', 'pdv', 'Prudential', [
        galleryImage('paineis', 'paineis-07-b', 'Material Prudential em ponto de venda'),
      ]),
      project('pdv-seara-fatiador', 'pdv', 'Seara', [
        galleryImage(
          'pdv',
          'seara-fatiador',
          'Fatiador de frios profissional personalizado com a marca Seara',
        ),
      ]),
      project('pdv-sest-senat', 'pdv', 'SEST SENAT', [
        galleryImage(
          'pdv',
          'sest-senat-totem',
          'Totem vertical externo azul escuro SEST SENAT em canteiro paisagístico',
        ),
      ]),
      project('pdv-jordan-adesivo', 'pdv', 'Adesivagem em vidro', [
        galleryImage(
          'pdv',
          'jordan-adesivo',
          'Adesivagem em porta de vidro com imagem em tamanho real do Michael Jordan',
        ),
      ]),
      project('pdv-friboi-barris', 'pdv', 'Friboi', [
        galleryImage(
          'pdv',
          'friboi-barris',
          'Barris metálicos azuis decorativos com logotipo Friboi em evento',
        ),
      ]),
      project('pdv-friboi-banners', 'pdv', 'Friboi+', [
        galleryImage(
          'pdv',
          'friboi-banners',
          'Banners verticais Friboi+ com carne grelhada e textos sobre segurança e sabor',
        ),
      ]),
      project('pdv-primor', 'pdv', 'Primor', [
        galleryImage(
          'pdv',
          'primor-pdv',
          'Exposição promocional da margarina Primor em ambiente interno, destacando uma réplica gigante da embalagem de 500g, totens empilhados da campanha Sabor Premiado e bandeirolas decorativas suspensas',
        ),
      ]),
      project('pdv-cenografia', 'pdv', 'Materiais diversos', [
        galleryImage('banners', 'banners-01', 'Cenografia promocional em ponto de venda'),
      ]),
      project('pdv-montana', 'pdv', 'Montana', [
        galleryImage(
          'pdv',
          'montana-pdv',
          'Display vertical PDV Montana Marfrig em corredor de supermercado',
        ),
      ]),
      project('pdv-kitkat', 'pdv', 'KitKat', [
        galleryImage(
          'pdv',
          'kitkat-pdv-b',
          'Dois totens promocionais KitKat em corredor de supermercado',
        ),
      ]),
    ],
    videos: [
      {
        id: 'production-wall-forest',
        src: '/assets/gallery/producao/producao-adesivacao-parede-floresta.mp4',
        poster: '/assets/gallery/producao/producao-adesivacao-parede-floresta-poster.jpg',
        alt: 'Adesivação de parede com paisagem de floresta',
      },
      {
        id: 'production-03',
        src: '/assets/gallery/producao/producao-03.mp4',
        poster: '/assets/gallery/producao/producao-03-poster.jpg',
        alt: 'Equipe em processo de produção visual',
      },
      {
        id: 'production-printing-vinyl',
        src: '/assets/gallery/producao/producao-impressao-vinil-verde.mp4',
        poster: '/assets/gallery/producao/producao-impressao-vinil-verde-poster.jpg',
        alt: 'Impressora digital em funcionamento produzindo lona',
      },
      {
        id: 'production-printing-seara',
        src: '/assets/gallery/producao/producao-impressao-seara.mp4',
        poster: '/assets/gallery/producao/producao-impressao-seara-poster.jpg',
        alt: 'Impressão digital colorida em produção',
      },
      {
        id: 'production-printing-medalhista',
        src: '/assets/gallery/producao/producao-impressao-medalhista.mp4',
        poster: '/assets/gallery/producao/producao-impressao-medalhista-poster.jpg',
        alt: 'Impressão digital de banner em produção',
      },
      {
        id: 'production-facade',
        src: '/assets/gallery/producao/producao-fachada-pb.mp4',
        poster: '/assets/gallery/producao/producao-fachada-pb-poster.jpg',
        alt: 'Fachada da P&B Comunicação Visual',
      },
      {
        id: 'production-02',
        src: '/assets/gallery/producao/producao-02.mp4',
        poster: '/assets/gallery/producao/producao-02-poster.jpg',
        alt: 'Produção em andamento na oficina da P&B',
      },
      {
        id: 'production-wall-city',
        src: '/assets/gallery/producao/producao-adesivacao-parede-cidade.mp4',
        poster: '/assets/gallery/producao/producao-adesivacao-parede-cidade-poster.jpg',
        alt: 'Adesivação de parede com paisagem urbana',
      },
      {
        id: 'production-wall-office',
        src: '/assets/gallery/producao/producao-adesivacao-parede-escritorio.mp4',
        poster: '/assets/gallery/producao/producao-adesivacao-parede-escritorio-poster.jpg',
        alt: 'Adesivação de parede em ambiente de escritório',
      },
      {
        id: 'production-rest-corner',
        src: '/assets/gallery/producao/producao-cantinho-descanso.mp4',
        poster: '/assets/gallery/producao/producao-cantinho-descanso-poster.jpg',
        alt: 'Cantinho de descanso da equipe na P&B',
      },
    ],
  },

  faq: {
    label: 'Dúvidas Frequentes',
    headline: {
      before: 'Perguntas',
      accent: 'Frequentes',
    },
    subheadline:
      'Esclarecimento tático das objeções mais comuns antes do seu contato.',
    items: [
      {
        q: 'Vocês realizam instalações em outros estados?',
        a: 'Sim, atuamos em todo o território nacional. Possuímos equipes especializadas e logística coordenada para instalação em qualquer estado do Brasil, garantindo o mesmo padrão de qualidade.',
      },
      {
        q: 'Qual a quantidade mínima de fornecimento?',
        a: 'Produção mínima de 1 m². Atendemos desde projetos pontuais até grandes encomendas corporativas com milhares de unidades.',
      },
      {
        q: 'Vocês elaboram o design das artes gráficas?',
        a: 'Focamos na produção com controle de qualidade. Também auxiliamos na adequação e finalização das artes para garantir a melhor qualidade de impressão e acabamento.',
      },
      {
        q: 'Como funciona a política de entregas?',
        a: 'Entrega garantida para a capital acima de R$ 300,00. Para demais regiões, realizamos envio por transportadora com rastreamento. Instalações são orçadas separadamente conforme a localização.',
      },
      {
        q: 'Qual o prazo médio de produção?',
        a: 'Varia conforme a complexidade e volume do projeto. Projetos padrão são entregues entre 5 a 15 dias úteis. Projetos de grande escala corporativa possuem cronograma dedicado com acompanhamento em tempo real.',
      },
    ],
  },

  form: {
    id: 'contato',
    kicker: 'Fale com a P&B',
    fields: {
      name: { label: 'Nome', placeholder: 'Como devemos te chamar?', required: true },
      company: { label: 'Empresa (opcional)', placeholder: 'Nome da sua empresa' },
      contact: {
        label: 'E-mail ou WhatsApp',
        placeholder: 'e-mail ou (11) 99999-9999',
        required: true,
      },
      message: {
        label: 'Conte sobre seu projeto',
        placeholder: 'Ex.: adesivação de 20 veículos, fachada em ACM, sinalização interna…',
        required: true,
      },
    },
    consent: {
      label:
        'Li e concordo em compartilhar estes dados para que a P&B entre em contato sobre meu orçamento.',
    },
    submit: 'Enviar pelo WhatsApp',
    submitSecondary: 'Prefiro enviar por e-mail',
    successWhatsApp:
      'Tudo certo! Abrimos o WhatsApp com sua mensagem — confira e aperte enviar.',
    successEmail:
      'Preparamos a mensagem no seu aplicativo de e-mail. Se nada abrir, escreva direto para vendas1@pbcomunicacao.com.br.',
  },

  ctaBanner: {
    subheadline:
      'Transforme espaços e ativos em ferramentas de visibilidade corporativa. Solicite seu orçamento e inicie seu projeto hoje.',
    ctas: [
      { text: 'Solicite seu Orçamento', variant: 'primary' },
      { text: '(11) 3836-0196', variant: 'phone' },
    ],
    trustLine: 'Atendimento corporativo • Orçamento sem compromisso',
  },

  footer: {
    copyright: 'P&B Comunicação Visual. Todos os direitos reservados.',
    location: 'Lapa, São Paulo — SP • Desde 2002',
  },
};
