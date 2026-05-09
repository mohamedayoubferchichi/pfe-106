import ProductPageTemplate from '../components/ProductPageTemplate';

const CONFIG = {
  title: 'Assurance Habitation', kicker: 'MON HABITATION', typeCode: 'HABITATION', declareLabel: 'Déclarer un sinistre habitation',
  contractAliases: ['habitation', 'logement', 'maison'],
  guarantees: [
    { icon: '🏠', title: 'Incendie & explosion', desc: 'Protection contre les sinistres liés au feu et aux explosions.' },
    { icon: '💧', title: 'Dégât des eaux', desc: 'Couverture des dommages causés par les fuites et inondations.' },
    { icon: '🔒', title: 'Vol & vandalisme', desc: 'Indemnisation en cas d\'effraction ou de dégradation volontaire.' },
  ],
  services: [
    { title: 'Constat en ligne', desc: 'Déclarez un dégât habitation directement depuis l\'app.', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' },
    { title: 'Expert à domicile', desc: 'Un expert se déplace pour évaluer les dommages.', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { title: 'Relogement temporaire', desc: 'Prise en charge si votre logement est inhabitable.', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  ],
  steps: [
    { step: '01', title: 'Signaler le sinistre', desc: 'Remplissez le formulaire avec photos des dégâts.' },
    { step: '02', title: 'Expertise', desc: 'Un expert évalue les dommages et estime le coût.' },
    { step: '03', title: 'Indemnisation', desc: 'Recevez votre indemnisation selon votre contrat.' },
  ],
  stats: [
    { value: '72h', label: 'Intervention expert' },
    { value: '100%', label: 'Digital' },
    { value: '200+', label: 'Experts partenaires' },
    { value: '98%', label: 'Satisfaction' },
  ],
};

export default function MonHabitationPage({ navigation }) {
  return <ProductPageTemplate navigation={navigation} config={CONFIG} />;
}