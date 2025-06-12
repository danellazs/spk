import { useState } from 'react';
import axios from 'axios';

interface AlternativeInput {
  name: string;
  criteria: number[];
}

interface Result {
  name: string;
  score: number;
}

function App() {
  const [alternatives, setAlternatives] = useState<AlternativeInput[]>([
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0] },
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0] },
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0] },
    { name: '', criteria: [0, 0, 0, 0, 0, 0, 0] },
  ]);

  const [results, setResults] = useState<Result[]>([]);

  const criteriaNames = [
    'Tingkat Urgensi',
    'Stok Saat Ini',
    'Stok yang Dibutuhkan',
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

  const handleSubmit = async () => {
    try {
      // Validasi nama alternatif tidak boleh kosong
      for (let alt of alternatives) {
        if (!alt.name.trim()) {
          alert('Semua alternatif harus memiliki nama.');
          return;
        }
      }

      // Proses alternatif: gabungkan stok menjadi "pasokan" → total jadi 6 kriteria
      const processedAlternatives = alternatives.map((alt) => {
        const stokSaatIni = alt.criteria[1];
        const stokDibutuhkan = alt.criteria[2];

        const pasokan =
          stokDibutuhkan === 0
            ? 0
            : ((stokDibutuhkan - stokSaatIni) / stokDibutuhkan) * 100;

        const newCriteria = [
          alt.criteria[0], // Tingkat Urgensi
          pasokan,         // Pasokan
          alt.criteria[3], // Tingkat Kelangkaan
          alt.criteria[4], // Harga
          alt.criteria[5], // Kualitas
          alt.criteria[6], // Layanan
        ];

        return {
          name: alt.name,
          criteria: newCriteria,
        };
      });

      // Bobot dan tipe kriteria
      const weights = [0.2, 0.15, 0.1, 0.1, 0.15, 0.15];
      const criteriaType = ['benefit', 'cost', 'cost', 'cost', 'benefit', 'benefit'];

      const response = await axios.post('http://localhost:3001/topsis', {
        alternatives: processedAlternatives,
        weights,
        criteriaType,
      });

      setResults(response.data);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat mengirim data ke server.');
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
