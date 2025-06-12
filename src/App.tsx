import { useState } from 'react';

interface AlternativeInput {
  name: string;
  criteria: number[];
}

interface Result {
  name: string;
  score: number;
}

// TOPSIS Utility Functions
const normalizeMatrix = (matrix: number[][]): number[][] => {
  const numCriteria = matrix[0].length;
  const normMatrix = Array.from({ length: matrix.length }, () => Array(numCriteria).fill(0));

  for (let j = 0; j < numCriteria; j++) {
    let sumSquares = 0;
    for (let i = 0; i < matrix.length; i++) {
      sumSquares += matrix[i][j] ** 2;
    }
    const denom = Math.sqrt(sumSquares) || 1;
    for (let i = 0; i < matrix.length; i++) {
      normMatrix[i][j] = matrix[i][j] / denom;
    }
  }

  return normMatrix;
};

const weightMatrix = (normalized: number[][], weights: number[]): number[][] => {
  return normalized.map(row => row.map((value, j) => value * weights[j]));
};

const getIdealSolutions = (weighted: number[][], criteriaType: string[]) => {
  const numCriteria = weighted[0].length;
  const idealPos = Array(numCriteria).fill(0);
  const idealNeg = Array(numCriteria).fill(0);

  for (let j = 0; j < numCriteria; j++) {
    const column = weighted.map(row => row[j]);
    if (criteriaType[j] === 'benefit') {
      idealPos[j] = Math.max(...column);
      idealNeg[j] = Math.min(...column);
    } else {
      idealPos[j] = Math.min(...column);
      idealNeg[j] = Math.max(...column);
    }
  }

  return { idealPos, idealNeg };
};

const calculateDistances = (weighted: number[][], ideal: number[]): number[] => {
  return weighted.map(row =>
    Math.sqrt(row.reduce((sum, val, j) => sum + (val - ideal[j]) ** 2, 0))
  );
};

// Main App Component
function App() {
  const [alternatives, setAlternatives] = useState<AlternativeInput[]>([
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0, 0] },
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0, 0] },
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0, 0] },
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0, 0] },
  ]);

  const [results, setResults] = useState<Result[]>([]);

  const criteriaNames = [
    'Tingkat Urgensi',
    'Stok Saat Ini',
    'Stok yang Dibutuhkan',
    'Waktu Pengiriman',
    'Tingkat Kelangkaan',
    'Harga',
    'Kualitas (Grade)',
    'Layanan Service & Garansi',
  ];

  const handleChange = (altIndex: number, critIndex: number, value: number) => {
    const newAlternatives = [...alternatives];
    newAlternatives[altIndex].criteria[critIndex] = value;
    setAlternatives(newAlternatives);
  };

  const handleNameChange = (index: number, value: string) => {
    const newAlternatives = [...alternatives];
    newAlternatives[index].name = value;
    setAlternatives(newAlternatives);
  };

  const handleSubmit = () => {
    try {
      for (let alt of alternatives) {
        if (!alt.name.trim()) {
          alert('Semua alternatif harus memiliki nama.');
          return;
        }
        if (alt.criteria.length !== 8 || alt.criteria.some(isNaN)) {
          alert('Semua nilai kriteria harus diisi dan berupa angka.');
          return;
        }
      }

      // Hitung waktu pengiriman persentase
      const waktuPengirimanArray = alternatives.map(alt => alt.criteria[3]);
      const maxWaktu = Math.max(...waktuPengirimanArray);
      const minWaktu = Math.min(...waktuPengirimanArray);
      const waktuPersentase = waktuPengirimanArray.map(waktu => {
        if (maxWaktu === minWaktu) return 0; // Avoid division by zero
        return ((maxWaktu - waktu) / (maxWaktu - minWaktu)) * 100;
      });

      const processedAlternatives = alternatives.map((alt, index) => {
        const stokSaatIni = alt.criteria[1];
        const stokDibutuhkan = alt.criteria[2];

        const pasokan =
          stokDibutuhkan === 0
            ? 0
            : ((stokDibutuhkan - stokSaatIni) / stokDibutuhkan) * 100;

        const newCriteria = [
          alt.criteria[0], // Urgensi
          pasokan,         // Pasokan
          waktuPersentase[index], // Waktu Pengiriman dalam Persentase
          alt.criteria[4], // Kelangkaan
          alt.criteria[5], // Harga
          alt.criteria[6], // Kualitas
          alt.criteria[7], // Layanan
        ];

        return {
          name: alt.name,
          criteria: newCriteria,
        };
      });

      const weights = [0.3, 0.25, 0.2, 0.2, 0.07, 0.05, 0.03];
      const criteriaType = ['benefit', 'benefit', 'cost', 'cost', 'cost', 'benefit', 'benefit'];

      const names = processedAlternatives.map(a => a.name);
      const matrix = processedAlternatives.map(a => a.criteria);

      const normalized = normalizeMatrix(matrix);
      const weighted = weightMatrix(normalized, weights);
      const { idealPos, idealNeg } = getIdealSolutions(weighted, criteriaType);

      const dPlus = calculateDistances(weighted, idealPos);
      const dMinus = calculateDistances(weighted, idealNeg);

      const scores = dMinus.map((dMin, i) => dMin / (dMin + dPlus[i]));

      const result = names.map((name, i) => ({
        name,
        score: parseFloat(scores[i].toFixed(4)),
      }));

      result.sort((a, b) => b.score - a.score);
      setResults(result);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memproses data.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Input Alternatif dan Kriteria</h2>

      {alternatives.map((alt, altIndex) => (
        <div
          key={altIndex}
          style={{
            marginBottom: 15,
            borderBottom: '1px solid #ccc',
            paddingBottom: 10,
          }}
        >
          <input
            type="text"
            placeholder={`Nama Alternatif ${altIndex + 1}`}
            value={alt.name}
            onChange={(e) => handleNameChange(altIndex, e.target.value)}
            style={{ marginBottom: 10, padding: 5, width: '250px' }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {criteriaNames.map((critName, critIndex) => (
              <div
                key={critIndex}
                style={{ display: 'flex', flexDirection: 'column', width: '160px' }}
              >
                <label style={{ fontSize: 12, marginBottom: 4 }}>{critName}</label>
                <input
                  type="number"
                  value={alt.criteria[critIndex]}
                  onChange={(e) =>
                    handleChange(altIndex, critIndex, Number(e.target.value))
                  }
                  style={{ padding: 5 }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        style={{
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 4,
        }}
      >
        Hitung TOPSIS
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Hasil Ranking</h3>
          <ol>
            {results.map((result, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <strong>{result.name}</strong> - Skor: {result.score.toFixed(4)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default App;
