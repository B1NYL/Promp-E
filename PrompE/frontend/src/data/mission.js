export const missions = [
  {
    id: 'daily_login',
    type: 'daily', // 매일 초기화되는 미션
    title: '매일매일 출석체크',
    description: 'PrompE에 접속하여 학습을 시작하세요.',
    goal: 1, // 목표 횟수
    reward: 10, // 보상 경험치
    icon: '📅',
    // isCompleted: (userData) => userData.lastLoginDate === new Date().toDateString(),
  },
  {
    id: 'complete_one_lesson',
    type: 'daily',
    title: '첫걸음 떼기',
    description: '오늘의 첫 학습을 완료해보세요.',
    goal: 1,
    reward: 20,
    icon: '👟',
    // isCompleted: (completionData) => completionData.todayCompletedCount >= 1,
  },
  {
    id: 'complete_five_lessons',
    type: 'weekly', // 매주 초기화되는 미션
    title: '학습 꾸러미',
    description: '이번 주에 5개의 학습을 완료하세요.',
    goal: 5,
    reward: 100,
    icon: '📦',
    // isCompleted: (completionData) => completionData.thisWeekCompletedCount >= 5,
  },
  {
    id: 'achieve_level_5',
    type: 'achievement', // 영구적인 업적
    title: '새싹 프롬프터',
    description: '레벨 5를 달성하세요.',
    goal: 5,
    reward: 200,
    icon: '🌱',
    // isCompleted: (userData) => userData.level >= 5,
  },
  {
    id: 'share_first_creation',
    type: 'achievement',
    title: '첫 작품 공유',
    description: '나의 작품집에 있는 작품을 소셜 갤러리에 공유해보세요.',
    goal: 1,
    reward: 50,
    icon: '🌐',
    // isCompleted: (socialData) => socialData.sharedCount >= 1,
  },
];