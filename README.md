<img
  src="./public/logo.png"
  width="500"  
/>


## Tech Stack

- node.js 18.15.0
- Next 13.5.4 (App Router)
- pnpm
- tensorflow.js
  - https://www.tensorflow.org/js?hl=ko
- MoveNet
  - https://www.tensorflow.org/hub/tutorials/movenet?hl=ko
  - lightning 모델과 thunder 모델을 지원한다. lightning 모델은 저사양 기기에서 고 fps를 구현하는데 유리하며 thunder 모델은 높은 정확도를 자랑하나 속도가 느린 특징이 있다. 본 앱에서는 lightning 모델을 사용하였다. lightning 모델은 현존하는 Pose Estimation 알고리즘 중에서 가장 빠른 속도를 자랑한다 (2023년 10월 기준)
- 배포 플랫폼 : Vercel    

## 실서비스에 사용할 태블릿 기종

iWork20

- 상세스펙

  - 1920x1200(WUXGA) (16:10)
  - Intel Celeron N4020 (1.1GHz)
    - https://www.intel.co.kr/content/www/kr/ko/products/sku/197310/intel-celeron-processor-n4020-4m-cache-up-to-2-80-ghz/specifications.html
  - 상세링크 : https://prod.danawa.com/info/?pcode=16101407

- 본 앱은 iWork20 해상도 기준으로 제작되었음

## 피그마 링크

    https://www.figma.com/file/obxCWBLUVaMXKfsi7Tbsx6/Prototyping-in-Figma-(Copy)?type=design&node-id=342%3A4207&mode=design&t=jmFQC6u0AQD73W7f-1

# 가이드 동영상

- 해상도 : 1440x2560
  - 동영상의 높은 해상도는 프레임레이트 저가의 주된 원인이다. 가로해상도 1920픽셀 기준으로 절반 크기인 960px미만으로 리사이징을 권장한다

`public\example_movies` 폴더에 아래의 이름으로 저장할 것

- 파일명

  - 벤치프레스 : bench_press.mp4
  - 스쿼트 : squat.mp4
  - 데드리프트 : deadlift.mp4

- Github은 단일 파일 사이즈의 크기를 최대 100MB로 제한하고 있다. 이에 100MB이상의 파일을 업로드하려면 Git LFS 기능을 사용해야 한다. 상세는 [여기](https://docs.github.com/ko/billing/managing-billing-for-git-large-file-storage/upgrading-git-large-file-storage)를 참조

# 포즈 인식 로직

`src\lib\counterLogic` 폴더에 저장되어 있음

현재 구현된 로직은 두 직선 사이의 각도를 계산하여 포즈를 판정한다

![](/public/angle.jpg)

위의 그림을 예시로 설명하겠다. 상단의 라인이 어깨부터 허리까지의 직선 거리이고 하단의 라인이 허리부터 무릎까지의 직선거리라고 가정해 보자. 데드리프트 하는 과정에서 상체를 올릴 때 각도가 늘어나고 바벨을 바닥에 내려놓을 때 각도가 줄어든다. 이 각도를 기준으로 UP, DOWN 판정을 수행하는 것이다. 데드리프트, 벤치프레스, 스쿼트 모두 이와같은 로직을 기반으로 한다
판정 각도 수정은 `src\lib\counterLogic/benchPress.ts`, `src\lib\counterLogic/deadlift.ts`, `src\lib\counterLogic/squat.ts` 파일의 최상단에 있는 `ANGLE_DOWN_THRESHOLD`, `ANGLE_UP_THRESHOLD` 변수를 수정할 것

# Movenet의 포즈 인식

Movenet의 PoseDetector는 이미지 또는 Video 엘리먼트를 인자로 받는다. 해당 이미지를 기반으로 포즈를 탐지하는데 몇가지 주의사항이 있다

- 전신이 다 드러나는 경우의 인식률이 가장 좋음.
- 전신이 드러나지 않는 상황에서는 얼굴이 드러나는 경우의 인식률이 비교적 높음. 즉 상체를 위주로 촬영할 것
- 정면으로 서있는 피사체의 인식률이 가장 높음
- 측면으로 누워있는 피사체의 인식률은 다소 낮음
- 화면이 반전되어 있을 경우 정상적으로 인식되지 않음
- 사람 외에 다른 오브젝트가 있을 경우 인식률이 저하됨
- 어두운 곳에서는 다소 인식률이 저하됨
- 아무런 옷을 입지 않았을 떄 인식률이 가장 높음
- 박시한 옷을 입은 경우 인식률이 떨어짐

# 포즈 인식 관련 파일

포즈 인식 관련 파일은 `src\lib\movenet` 폴더에 저장되어 있다. 핵심 로직은 이하의 3개 파일을 참조할 것

- `movenetMainV2.ts` : 메인 로직. 해당 로직은 최초에 1회 수행된다.
- `camera.ts` : 웹캠에서 비디오 스트림을 리턴받고 해당 비디오의 해상도 기준으로 비디오 엘리먼트와 캔버스 엘리먼트의 Width, Height를 설정한다. 해당 로직은 최초에 1회 수행된다.
- `renderer_canvas2d.ts` : 캔버스 랜더링 관련 로직. `RendererCanvas2d` 클래스의 draw 메소드는 웹캠 비디오 및 스켈레톤 포즈를 캔버스에 드로잉한다. 화면에 보이는 영상은 비디오 엘리먼트처럼 보이지만 실제로는 해당 로직을 기반으로 캔버스상에 드로잉된 것이다. 스켈레톤 포즈는 개발 모드에서만 렌더링되며 Production 모드에서는 렌더링되지 않는다. `draw` 메소드는 `requestAnimationFrame`에 의해 호출된다. 상세는 `src\components\MovenetV2.tsx` 파일의 `renderPrediction` 함수를 참조할 것

# 주의사항 1

본 프로그램은 조이트론사의 HD20 웹캠 사용을 전제로 제작되었다. 해당 웹캠의 해상도는 1920x1080이며 가로(Landscape) 해상도이지만 실제로 앱에서 보여지는 화면은 세로(Portrait) 해상도이다. 이에 웹캠을 세로각도로 회전하여 촬영하게 되는데 세로로 회전하게 되면 사물이 90도 각도로 회전되어 촬영되는 문제가 발생한다. 위에서 언급했다 시피 Movenet은 정면으로 서있는 피사체의 인식률이 가장 높음으로 정면으로 서있는 피사체로 인식되도록 화면을 회전시키는 작업이 추가로 선행된다. 상세는 `src\components\MovenetV2.tsx` 파일의 `renderResult` 함수를 참조할 것

# 주의사항 2

포즈 인식 관련 알고리즘은 크게 2가지로 분류된다

1. 벤치프레스
2. 스쿼트, 데드리프트

2분류로 구분되는 이유는 벤치프레스가 누워서 하는 운동이기 때문이다. Movenet의 포즈 인식 알고리즘은 측면으로 누워있는 사진의 인식률이 다소 낮기 때문에 이 사진을 90도 회전하여 정면으로 비추어야 인식률이 높아진다. 그렇기 때문에 `벤치프레스` 운동에 한하여 화면을 90도 회전할 필요가 있다. 이 작업은 Rotate용 캔버스 엘리먼트를 기반으로 수행된다 상세는 `src\components\MovenetV2.tsx` 파일의 `renderResult` 함수를 참조할 것

# 스쿼트 자세 탐지 알고리즘 (무릎이 튀어나온 경우)

해당 로직은 `src\lib\counterLogic\squat.ts` 경로의 `judgeIsIncorrectKnee` 함수에 저장되어 있음

함수 judgeIsIncorrectKnee의 핵심 로직은 무릎과 발목을 수직으로 이은 직선의 기울기를 판단하는 것이다

![gradient](/public/gradient.png)

직선이 수직에 가까울 수록 기울기는 커지며 45도 각도 이상이 되면 1 이상의 값을 갖게 된다. 반면 직선이 수평에 가까워질 수록 기울기는 작아지며 45도 각도 미만이 되면 1 미만의 값을 갖게 된다

이를 실전에 응용해 보자. 직선이 수직일 때는 정자세로 서있는 경우이며 무릎이 앞으로 돌출될 수록 기울기 값은 작아진다. 결국 우리는 특정한 기울기 값을 기준점으로 삼아 이 기준값보다 기울기가 더 작을 때 경고 문구를 출력하고 싶은 것이다. 이 기준점이 되는 기울기 값은 INCORRENT_KNEE_GRADIENT_THRESHOLD 변수로 조작할 수 있다. 

그 외 주의사항 : 무릎이 튀어나온 정도는 x좌표의 절대값으로 탐지하여서는 안 된다. 그 이유는 사람마다 종아리의 길이가 다르기 때문이다.
종아리의 길이가 20cm인 사람과 30cm인 사람이 각각 있다고 가정하자. 이들 둘이 5cm만큼 무릎이 튀어나왔다고 가정할 때 두 사람이 튀어나온 무릎의 비중은 전체 종아리의 길이대비 차지하는 퍼센테이지가 상이하다. 그러므로 자세의 어긋남을 판정할 때는 신체의 특정부위대비 비율로 계산하는 것이 바람직하다. 또는 judgeIsIncorrectKnee 함수에서 제시된 방법대로 신체부위의 기울기를 바탕으로 평가하는 것이 권장된다