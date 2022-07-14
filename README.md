# wooCommerceSyncServer

어드민페이지 기능을 하는 워드프레스 플러그인 우커머스(wooCommerce)와 상품 DB(mongoDB)를 연동하는 프로젝트 입니다.

//aws cli 다운로드
1.Python과 pip가 모두 올바르게 설치되었는지 확인 2. <Windows에서 AWS CLI 설치>
https://techexpert.tips/ko/amazon-aws-ko/windows에서-aws-cli-설치/ 3. pip install awsebcli --upgrade --user를 이용해 EB CLI를 설치합니다.

설치한 후, %USERPROFILE%\AppData\roaming\Python\Python37\scripts를 PATH환경변수에 추가합니다.
_환경변수 추가 전 안되면 위 경로 들어가서 eb 존재 확인_
프롬프트 및 쉘을 재시작한 후, eb --version를 이용해 EB CLI가 잘 설치됬는지 확인합니다.

**app.ts**

1.Express, MongoDB, AWS, Woocommerce 연결 setting 2. 전처리서버에서 sqsAppForWc(AWS-sqs)에 보낸 메시지를 받아옴 3. 받아온 이후 Priority queue를 이용하여 woocommerce api로 생성 or 수정(woocommerce 과부화를 막기 위함)  
4. Woocommerce에서 생성 or 수정 이후 보내준 data를 sqsAppForMongoDB(AWS-sqs)에 보내줌 5. sqsAppForMongoDB(AWS-sqs)에서 메시지를 받아와 page_url 기준 일치하는 mongoDB document wc_custom & woocommerce_id update 6. 메시지를 받기 시작하면 hook을 껐다가 받아온 메시지 우커머스에 보내진 메시지 갯수와 몽고db에 update된 document 갯수가 일치하는 순간 hook을 다시 reactivate

**woocommerce hook**

1. create : woocommerce admin page에서 생성하면 mongoDB에서 동일한 Page_url을 가진 document wc_custom & woocommerce_id update
2. update : woocommerce admin page에서 생성하면 mongoDB에서 동일한 Page_url을 가진 document wc_custom & woocommerce_id update
3. delete : woocommerce admin page에서 휴지통으로 이동시키면 동일한 Page_url을 가진 document 삭제
4. retrieve: woocommerce admin page 휴지통에서 복구시키면 해당 product data 정보 받아서 다시 삭제되었던 document 생성

**TDD**

jest 활용

1. sqs에 잘 전송되는지
2. sqs에 전송되어있는 메시지 잘 받는지(보내진 메시지 갯수와 받은 메시지가 동일한지)
3. 받은 메시지 중 동일한 메시지를 두 번이상 받았는지(중복확인)
4. 메시지 받아서 우커머스에 보냈을 때 상품이 잘 생성되는지

**Docker**

1. dev,staging,prod 파일 만들고 npm run script에서 cpy 모듈을 통해 dockerfile 삭제 후
   실행 스크립트 마다 해당 dockerfile.[dev,staging,prod 복사.
2. from : docker 이미지
   workdir : docker 안 directory
   copy : docker container에서 구동할 파일 복사
   run : container 구동 전 진행(주로 package 다운)
   expose : host에서 container 안에 접근 할 수 있게 하는 port
   cmd : container 안에서 실행시킬 script

**Elasticbeanstalk -배포**

1.EB CLI 설치 (TERMINAL 혹은 CMD 에서 Elastic Beanstalk 설정하기 위함)
(https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/eb-cli3-install-windows.html)

# 설치한 후, %USERPROFILE%\AppData\roaming\Python\Python37\scripts를 PATH환경변수에 추가합니다.

_환경변수 추가 전 안되면 위 경로 들어가서 eb 존재 확인,_

프롬프트 및 쉘을 재시작한 후, eb --version를 이용해 EB CLI가 잘 설치됬는지 확인합니다.

설치 후 프롬프트 다시 켜야 작동

2. aws configure 구성

\*\* aws에 액세스 키 설정을 해야 cli와 aws 계정 연동됨.
(https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/cli-configure-quickstart.html)

3.  Elastic Beanstalk CLI를 사용하여 애플리케이션 배포 .
    (https://medium.com/@sommershurbaji/deploying-a-docker-container-to-aws-with-elastic-beanstalk-28adfd6e7e95)

4.  eb init 으로 환경설정
    (1)Platform은 ocker running on 64bit Amazon Linux 2
    (2)region 설정
    (3)ssh접속 필요시 aws에서 키페어 생성 후 등록

5.  eb create 으로 환경 생성
    (1)git에 가장 최근 commit 된 file을 .zip으로 묶어 배포함(eb create는 환경생성과 동시에 application이 같이 upload됨)
    따라서, 배포전 git에 commit 했는지 확인 필요.
    (2)사전에 ec2,loadbancer,autoscaling,securitygroup 등의 setting은 .ebextenstions folder 생성 후 ##.config(yaml) 파일 활용.
    (https://github.com/jweyrich/aws-demo-php-eb-elasticache/blob/master/.ebextensions/01_instance.config)

**Elasticache-redis 사용**

# 보안그룹

1. AWS 보안그룹 생성
2. VPC 설정(redis 생성할 때 같은 것으로 해줘야 함)
3. 인바운드 규칙 TCP 6379 port 추가

# Elasticache 들어가서 redis 생성

1. port는 6379로 설정
2. subnet group은 보안그룹에서 설정한 vpc 선택
3. 위에서 생성한 보안그룹 선택

# redis 연결 모듈 설치

1. npm i redis --save
2. npm i connect-redis express-session --save

# redis.createClient

1. host,port setting
2. host는 elasticache에서 생성한 redis primary endpoint로 설정(not replica)

# eb cli로 배포시 미리 환경설정(보안그룹,vpc,subnet 등)필요

1. .ebextensions 폴더밑에 xx.config 파일 생성(폴더,파일이름 규칙 중요)
2. redis에 설정해놓은 VPCId,SecurityGroups 동일하게 setting
3. subnet은 사용해도 되고 안해도 됨.

# 참고자료

- https://inma.tistory.com/45

- http://pyrasis.com/book/TheArtOfAmazonWebServices/Chapter15/07

- https://github.com/jweyrich/aws-demo-php-eb-elasticache/blob/master/.ebextensions/01_instance.config
