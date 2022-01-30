import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";

export class ApigatewayBinaryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambdaの定義
    const LAMBDA_FUNCTION_DIR = path.join(__dirname, "../lambda");
    const zipDownloadFunction = new Function(this, "ZipDownloadFunction", {
      code: Code.fromAsset(`${LAMBDA_FUNCTION_DIR}/zip_download`),
      handler: "index.handler",
      runtime: Runtime.PYTHON_3_9,
      // 念のためタイムアウトを30秒に設定
      timeout: Duration.seconds(30),
    });
    zipDownloadFunction.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
    );

    // API Gatewayの定義
    const api = new RestApi(this, "BynaryDataApi", {
      // CORSの設定。状況に応じて適宜変える
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: Cors.DEFAULT_HEADERS,
        disableCache: true,
      },
      // デプロイする環境 状況に応じて適宜変える
      deployOptions: {
        stageName: "dev",
      },
      // 【重要】バイナリメディアタイプの指定
      binaryMediaTypes: ["application/zip"],
    });
    api.root
      .addResource("zip-download")
      .addMethod("GET", new LambdaIntegration(zipDownloadFunction));
  }
}
