import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Fungsi untuk normalisasi matriks
const normalizeMatrix = (matrix: number[][]): number[][] => {
  const numCriteria = matrix[0].length;
  const normMatrix = Array.from({ length: matrix.length }, () => Array(numCriteria).fill(0));

  for (let j = 0; j < numCriteria; j++) {
    let sumSquares = 0;
    for (let i = 0; i < matrix.length; i++) {
      sumSquares += matrix[i][j] ** 2;
    }
    const denom = Math.sqrt(sumSquares);
    for (let i = 0; i < matrix.length; i++) {
      normMatrix[i][j] = matrix[i][j] / (denom || 1);
    }
  }

  return normMatrix;
};

// Fungsi untuk mengalikan bobot
const weightMatrix = (normalized: number[][], weights: number[]): number[][] => {
  return normalized.map(row => row.map((value, j) => value * weights[j]));
};

// Fungsi untuk mencari solusi ideal positif/negatif
const getIdealSolutions = (weighted: number[][], criteriaType: string[]) => {
  const numCriteria = weighted[0].length;
  const idealPos = Array(numCriteria).fill(0);
  const idealNeg = Array(numCriteria).fill(0);

  for (let j = 0; j < numCriteria; j++) {
    const column = weighted.map(row => row[j]);
    idealPos[j] = criteriaType[j] === 'benefit' ? Math.max(...column) : Math.min(...column);
    idealNeg[j] = criteriaType[j] === 'benefit' ? Math.min(...column) : Math.max(...column);
  }

  return { idealPos, idealNeg };
};

// Fungsi untuk menghitung jarak ke solusi ideal
const calculateDistances = (weighted: number[][], ideal: number[]): number[] => {
  return weighted.map(row =>
    Math.sqrt(row.reduce((sum, val, j) => sum + (val - ideal[j]) ** 2, 0))
  );
};

// Rute utama TOPSIS
app.post('/topsis', (req, res) => {
  try {
    const { alternatives, weights, criteriaType } = req.body;

    const names = alternatives.map((alt: any) => alt.name);
    const matrix = alternatives.map((alt: any) => alt.criteria);

    const normalized = normalizeMatrix(matrix);
    const weighted = weightMatrix(normalized, weights);
    const { idealPos, idealNeg } = getIdealSolutions(weighted, criteriaType);

    const dPlus = calculateDistances(weighted, idealPos);
    const dMinus = calculateDistances(weighted, idealNeg);

    const scores = dMinus.map((dMin, i) => dMin / (dMin + dPlus[i]));

    const result = names.map((name: string, i: number) => ({
      name,
      score: scores[i],
    }));

    result.sort((a: { name: string; score: number }, b: { name: string; score: number }) => b.score - a.score);

    res.json(result);
  } catch (err) {
    console.error('Error in /topsis:', err);
    res.status(500).json({ error: 'Proses TOPSIS gagal.' });
  }
});

app.listen(PORT, () => {
  console.log(`TOPSIS server running at http://localhost:${PORT}`);
});
