
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GraficoBarras = () => {
  const data = {
    labels: [
      ['Río Grande', 'TDF 2026'], 
      ['Ushuaia Open', '2027'], 
      ['Nacionales', 'Argentinas', 'SDE 2026'] 
    ],
    datasets: [
      {
        label: 'Inscripciones',
        data: [15, 40, 80], 
        backgroundColor: '#5b32ec', 
        borderRadius: 4,
        barPercentage: 0.7, 
        categoryPercentage: 0.5, 
      },
      {
        label: 'Cupos',
        data: [40, 45, 100], 
        backgroundColor: '#1d63ed', 
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.5,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    
    plugins: {
      legend: {
        position: 'top',
        align: 'start', 
        labels: {
          color: '#ffffff',
          usePointStyle: true, 
          boxWidth: 8, 
          font: { size: 16 }
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#ffffff', font: { size: 11 } },
        grid: { display: false } 
      },
      y: {
        beginAtZero: true,
        max: 200,
        ticks: { color: '#ffffff', font: { size: 14 }, padding: 10 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
        border: { display: false }, 
        afterBuildTicks: (axis) => {
          axis.ticks = [0, 15, 30, 45, 80, 100, 120, 140, 160].map(v => ({ value: v }));
        }
      }
    }
  };

  return(
    <div style={{ height: '340px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default GraficoBarras;