import ProductPageTemplate from '../components/ProductPageTemplate';

const CONFIG = {
  title: 'Assurance Prévoyance', kicker: 'MA PRÉVOYANCE', typeCode: 'PREVOYANCE', declareLabel: 'Déclarer un sinistre prévoyance',
  contractAliases: ['prevoyance', 'protection', 'life'],
  guarantees: [
    { icon: '❤️', title: 'Décès & invalidité', desc: 'Capital versé en cas de décès ou d\'invalidité permanente.' },
    { icon: '🏥', title: 'Hospitalisation', desc: 'Indemnités journalières en cas d\'hospitalisation prolongée.' },
    { icon: '👨‍👩‍👧‍👦', title: 'Protection familiale', desc: 'Rente éducation et capital pour protéger vos proches.' },
  ],
  services: [
    { title: 'Accompagnement personnalisé', desc: 'Un conseiller dédié pour chaque dossier prévoyance.', img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80' },
    { title: 'Gestion simplifiée', desc: 'Suivez vos garanties et sinistres depuis votre espace.', img: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=800&q=80' },
    { title: 'Versement rapide', desc: 'Indemnisation rapide après validation du dossier.', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80' },
  ],
  steps: [
    { step: '01', title: 'Constituer le dossier', desc: 'Rassemblez les justificatifs et certificats nécessaires.' },
    { step: '02', title: 'Analyse médicale', desc: 'Expertise médicale pour évaluer le dossier.' },
    { step: '03', title: 'Décision & versement', desc: 'Capital ou rente versé selon les garanties du contrat.' },
  ],
  stats: [
    { value: '48h', label: 'Prise en charge' },
    { value: '100%', label: 'Confidentiel' },
    { value: '15k+', label: 'Familles protégées' },
    { value: '99%', label: 'Fiabilité' },
  ],
};

export default function MaPrevoyancePage({ navigation }) {
  return <ProductPageTemplate navigation={navigation} config={CONFIG} />;
}