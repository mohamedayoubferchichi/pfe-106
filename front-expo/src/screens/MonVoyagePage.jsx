import ProductPageTemplate from '../components/ProductPageTemplate';

const CONFIG = {
  title: 'Assurance Voyage', kicker: 'MON VOYAGE', typeCode: 'VOYAGE', declareLabel: 'Déclarer un sinistre voyage',
  contractAliases: ['voyage', 'travel'],
  guarantees: [
    { icon: '✈️', title: 'Annulation voyage', desc: 'Remboursement en cas d\'annulation pour raison médicale ou autre.' },
    { icon: '🏥', title: 'Frais médicaux', desc: 'Prise en charge des frais médicaux à l\'étranger.' },
    { icon: '🧳', title: 'Bagages', desc: 'Indemnisation en cas de perte, vol ou détérioration de vos bagages.' },
  ],
  services: [
    { title: 'Assistance mondiale', desc: 'Bénéficiez d\'une assistance 24/7 partout dans le monde.', img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80' },
    { title: 'Rapatriement', desc: 'Organisation et prise en charge du rapatriement sanitaire.', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109db56?auto=format&fit=crop&w=800&q=80' },
    { title: 'Responsabilité civile', desc: 'Protection contre les dommages causés à des tiers à l\'étranger.', img: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80' },
  ],
  steps: [
    { step: '01', title: 'Déclarer l\'incident', desc: 'Remplissez le formulaire avec les détails du sinistre.' },
    { step: '02', title: 'Justificatifs', desc: 'Joignez factures, billets et certificats médicaux.' },
    { step: '03', title: 'Remboursement', desc: 'Recevez l\'indemnisation selon les termes du contrat.' },
  ],
  stats: [
    { value: '24/7', label: 'Assistance mondiale' },
    { value: '72h', label: 'Traitement dossier' },
    { value: '150+', label: 'Pays couverts' },
    { value: '97%', label: 'Satisfaction' },
  ],
};

export default function MonVoyagePage({ navigation }) {
  return <ProductPageTemplate navigation={navigation} config={CONFIG} />;
}