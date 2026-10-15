import { siteData } from '../../data/siteData';
import WhatsAppIcon from './WhatsAppIcon';
import { pushEvent } from '../../utils/analytics';

export default function FloatingWhatsApp() {
  return (
    <a
      href={siteData.contact.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Fale conosco pelo WhatsApp"
      title="Fale conosco pelo WhatsApp"
      onClick={() => pushEvent('whatsapp_click', { location: 'floating_button' })}
    >
      <WhatsAppIcon className="whatsapp-float-icon" />
    </a>
  );
}
