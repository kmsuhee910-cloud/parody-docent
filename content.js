// 전시 제목과 관람객용 파일 경로는 이 파일에서 관리합니다.
// 경로는 assets/ 안의 상대 경로만 사용하세요. 빈 문자열은 준비 중 상태입니다.
// thumbnail을 지정하면 목록에 별도 이미지를 사용합니다. 생략하면 image를 사용합니다.
window.EXHIBITION = {
  titleLines: ['개념미술 작품 패러디', ': OO으로서의 언어'],
  tracks: [
    { title: '전시 인사말', image: 'assets/poster.jpg', audio: 'assets/track_01.m4a' },
    { title: '<같은 행동, 다른 의미>', image: 'assets/work-02.png', frameless: true, audio: '' },
    { title: '<나는 아직 여기있다.>', image: 'assets/work-03.png', frameless: true, audio: '' },
    { title: '<하나이면서 셋인 동아리방>', image: 'assets/work_04.jpg', frameless: true, audio: '' }
  ]
};
