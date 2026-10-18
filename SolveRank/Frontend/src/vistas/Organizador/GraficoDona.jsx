
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Plugin personalizado para dibujar el texto en el centro
const textoCentralPlugin = {
  id: 'textoCentral',
  beforeDraw: function(chart) {
    const ctx = chart.ctx;
    const textX = chart.getDatasetMeta(0).data[0].x;
    const textY = chart.getDatasetMeta(0).data[0].y;
    
    ctx.restore();
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    
    // Número 12
    ctx.font = "bold 45px Inter";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("12", textX, textY - 10);
    
    // Palabra "Torneos"
    ctx.font = "20px Instrument Sans";
    ctx.fillText("Torneos", textX, textY + 15);
    ctx.save();
  }
};

const GraficoDona = () => {
  const data = {
    labels: ['En vivo', 'Inscripciones abiertas', 'Próximos', 'Finalizados'],
    datasets: [{
      data: [2, 2, 2, 2], 
      backgroundColor: ['#00a800', '#1d63ed', '#ff8c00', '#6b32ec', '#1246B4'], 
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
  return <Doughnut data={data} options={options} plugins={[textoCentralPlugin]} />;
};

export default GraficoDona;