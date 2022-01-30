import base64
import boto3
import zipfile

s3 = boto3.resource("s3")
bucket = s3.Bucket("sample-bucket")


def handler(event, context):

    prefix = "folder/"
    # BucketにあるオブジェクトのうちPrefixが "folder/" で始まるものに絞り込む
    object_summaries = bucket.objects.filter(Prefix=prefix).all()
    # Lambdaで一時ファイルを扱う場合は/tmp直下に配置する
    zip_path = "/tmp/data.zip"

    # zipファイルを作成する処理
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as new_zip:
        for summary in object_summaries:
            if summary.key.endswith(".pdf"):
                # ファイル名を取り出す folder/data1.pdf
                filename = summary.key.split("/")[1]
                # S3オブジェクトを取得する
                s3_object = summary.get()
                # バイナリデータ部分取得
                body = s3_object["Body"].read()

                new_zip.writestr(filename, body)

    # 作成したzipをレスポンスとして返す処理
    with open(zip_path, "rb") as zip_data:
        zip_bytes = zip_data.read()

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/zip",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
            },
            "body": base64.b64encode(zip_bytes).decode("utf-8"),
            "isBase64Encoded": True,
        }
