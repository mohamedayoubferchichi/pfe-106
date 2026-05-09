import ProductPageTemplate from '../components/ProductPageTemplate';

const CONFIG = {
  title: 'Assurance Auto', kicker: 'MA VOITURE', typeCode: 'AUTO', declareLabel: 'Déclarer un sinistre auto',
  contractAliases: ['auto', 'voiture'],
  guarantees: [
    { icon: '🛡️', title: 'Responsabilité civile', desc: 'Protection essentielle pour couvrir les dommages causés à des tiers.' },
    { icon: '🚘', title: 'Tous risques', desc: 'Couverture complète pour protéger votre véhicule au quotidien.' },
    { icon: '🛠️', title: 'Assistance 24/7', desc: 'Aide rapide partout en Tunisie en cas de panne ou d\'accident.' },
  ],
  services: [
    { title: 'Déclaration rapide', desc: 'Déclarez votre sinistre auto en quelques minutes.', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' },
    { title: 'Remorquage & assistance', desc: 'Assistance 24/7 en cas de panne ou accident.', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80' },
    { title: 'Suivi du dossier', desc: 'Suivez chaque étape du traitement de votre dossier.', img: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80' },
  ],
  steps: [
    { step: '01', title: 'Déclarer en ligne', desc: 'Remplissez le formulaire et ajoutez les photos.' },
    { step: '02', title: 'Analyse du dossier', desc: 'Analyse automatique puis validation si besoin.' },
    { step: '03', title: 'Décision & indemnisation', desc: 'Suivez la décision depuis votre espace client.' },
  ],
  stats: [
    { value: '24/7', label: 'Assistance routière' },
    { value: '48h', label: 'Prise en charge' },
    { value: '160', label: 'Agences partenaires' },
    { value: '95%', label: 'Clients satisfaits' },
  ],
};

export default function MaVoiturePage({ navigation }) {
  return <ProductPageTemplate navigation={navigation} config={CONFIG} />;
}