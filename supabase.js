// Created: 2026-03-04 10:00
// Supabase 클라이언트 초기화 및 DB 함수
// 실제 키는 config.js (gitignore 처리)에서 window 전역으로 주입됩니다.

const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

/**
 * 점수를 Supabase에 저장
 * @param {string} playerName
 * @param {number} moves
 * @param {number} timeSeconds
 * @param {number} score
 */
async function saveScore(playerName, moves, timeSeconds, score) {
  const { error } = await db.from('scores').insert({
    player_name: playerName,
    moves,
    time_seconds: timeSeconds,
    score,
  });
  if (error) console.error('점수 저장 실패:', error.message);
}

/**
 * 상위 10명 랭킹 조회
 * @returns {Array} 랭킹 데이터 배열
 */
async function getLeaderboard() {
  const { data, error } = await db
    .from('scores')
    .select('player_name, moves, time_seconds, score, created_at')
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('랭킹 조회 실패:', error.message);
    return [];
  }
  return data;
}
