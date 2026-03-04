// Created: 2026-03-04 10:00
// Supabase 클라이언트 초기화 및 DB 함수

const SUPABASE_URL = 'https://lffrvcvpabbluhnyxijm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZnJ2Y3ZwYWJibHVobnl4aWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTE5OTcsImV4cCI6MjA4ODE4Nzk5N30.ZXqBJZx3wMOZ9D7pR71782iKYShQgAYUkAPorhDa3UQ';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
