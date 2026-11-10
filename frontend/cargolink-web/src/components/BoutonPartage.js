import React from 'react';

const LIEN = 'https://play.google.com/store/apps/details?id=com.exdivia.cargolink';
const MESSAGE =
    'Transportez ou faites transporter vos marchandises au Cameroun avec CargoLink : ' +
    'comparez les offres des transporteurs et choisissez la meilleure. ' +
    'Telechargez l\'application gratuitement : ' + LIEN;

function BoutonPartage() {
    const partager = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: 'CargoLink Cameroun', text: MESSAGE });
                return;
            }
        } catch (e) {
            if (e && e.name === 'AbortError') return;
        }
        window.open('https://wa.me/?text=' + encodeURIComponent(MESSAGE), '_blank');
    };
    return (
        <button
            onClick={partager}
            style={{
                background: '#25D366', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 16px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
                margin: '0 0 15px 0'
            }}
        >
            Partager CargoLink (WhatsApp)
        </button>
    );
}

export default BoutonPartage;
