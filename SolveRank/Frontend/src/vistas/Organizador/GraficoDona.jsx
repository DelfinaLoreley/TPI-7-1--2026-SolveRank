
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Plugin personalizado para dibujar el texto en el centro
const textoCentralPlugin = (total) => ({
  id: 'textoCentral',
  beforeDraw: function(chart) {
    const ctx = chart.ctx;
    const centro = chart.getDatasetMeta(0).data[0];
    if (!centro) return;
    const textX = centro.x;
    const textY = centro.y;
    
    ctx.restore();
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    
    ctx.font = "bold 45px Inter";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(total), textX, textY - 10);
    
    // Palabra "Torneos"
    ctx.font = "20px Instrument Sans";
    ctx.fillText("Torneos", textX, textY + 15);
    ctx.save();
  }
});

const GraficoDona = ({ resumen, total = 0 }) => {
  const data = {
    labels: ['En vivo', 'Inscripciones abiertas', 'Próximos', 'Finalizados'],
    datasets: [{
      data: [resumen.enVivo, resumen.inscripcionesAbiertas, resumen.proximos, resumen.finalizados],
      backgroundColor: ['#00a800', '#1d63ed', '#ff8c00', '#6b32ec'],
      borderWidth: 0, 
      cutout: '70%', 
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        position: 'right', 
        labels: {
          color: '#ffffff',
          usePointStyle: true,
          padding: 20,
          font: { size: 16 }
        }
      }
    }
  };

  // Pasamos el plugin al componente
  return <Doughnut data={data} options={options} plugins={[textoCentralPlugin(total)]} />;
};

export default GraficoDona;
