---
title: "Using Amazon Transcribe for transcription and speaker separation"
description: ""
date: "2021-05-17T15:07:00+09:00"
thumbnail: "/img/man-593333_1920.jpg"
tags: [AWS, transcription]
---
There is a transcription service called Amazon Transcribe.

The features of this service include

- Speaker separation as of 2021/05/17
- Japanese language support
- It supports both video and audio formats.

There are some points.

I'll write down how to use it with GUI.

## Procedure
There is nothing difficult about the procedure, just follow the instructions on the screen. 1.

Login to the AWS console. 1.
   1. you need to create an account for AWS. 2.
2. upload the audio file to S3. 1.
   You don't need to tweak any options. 2.
   2. choose a region that is close to your location.
3. transcribe with Amazon Transcribe
   1. click "create job
   2. name can be anything as long as it's distinguishable. 3.
   For Langueage, select Japanese. 4.
   For Input data, select the file you uploaded from Browse S3.
   Click Next. 6.
   Audio setting
      Turn on Audio identification (speaker separation).
      Select Speaker Identification to distinguish between speakers by using the characteristics of each speaker. 3.
      Turn on Alternative results. 1.
         Set Maximum alternative to 1. 2.
         The number of alternatives you set here will be output. If you want to examine the variations, you can set the number to more than 2. 7.
   7. click create. 8.
   8. confirm that the job you entered in Name is added to Transcription jobs. 9.
   Wait for the Status to become Complete. 10.
   Click on the target to get the output json.

## Extract speech by speaker
Example script
Writing in python

Import json
import json
from os import path
folder_path = 'directory/path'
json_path = path.join(folder_path, "asrOutput.json")
with open(json_path, "r") as f:
    data = json.load(f)
speaker_labels = [item["speaker_label"] for item in data["results"]["speaker_labels"]["segments"]]
transcripts = [item["alternatives"][0]["transcript"] for item in data["results"]["segments"]]
lines = ["{}:{}".format(sp,tr) for sp, tr in zip(speaker_labels, transcripts)]
with open(path.join(folder_path, "transcript.txt"), 'w') as f:
    f.write('\n'.join(lines))
````

Example of extracted transcript.txt
```
spk_0:yes yes
spk_0:yes what day is it today?
spk_0: Fifteenth day of the twentieth year of high pressure.
spk_0: So, just as a first project.
spk_0:yes
spk_0: or
It's like a national highway.
Yeah, I mean...
Whenever I upload a YouTube video, Takehana-san also asks me, "What month is today? What day is it? What day?
Yeah.
spk_0: If you can, but if it's a gate that you're going to keep, it's better to leave a record of when you took the video, and of course there's the cost of creating the data, but it's better to mention it.
spk_0:If you want to do it while you're still thinking about how to compete with them when you ask them back later? I'm sure you'll be happy to hear that.
That's what I'm thinking.
spk_0: Since it's the first show, do you want to do a little introduction?
spk_0: Yes.
spk_0:Yes
From here
- Change speaker's label.
- Correcting typos and errors

and so on.

The timing of the speech is also included in the json file.
You can also generate simple subtitles automatically.

[Using FFmpeg to burn subtitles for videos](https://www.storange.jp/2015/12/ffmpeg.html)

## Using the CLI gives you a large free frame
If you can automate the process with the CLI, you will get a larger free frame.
If possible, you should consider using the CLI.

## Cautions
- You will be charged for transcriptions that take longer than the free quota.
  - There have been cases in the past where people have been hacked and charged huge fees, not only for AWS.
  - If you don't have any idea what happened, contact support and they will take care of it.
  - As with credit card information, please be careful with security.
- Transcription is not perfect.
  - Also, there are times when the transcription is not as good as the conversation.
  - You can edit it to make it more interesting.
- Reading and understanding json files requires some familiarity.
  - There is a part in the script that mentions the structure of json, but I won't explain it here.
  - It's better to look at the whole picture while formatting it in an IDE.

## Improvements
- Punctuation might make it easier to read.
- If the same speaker continues, it might be better to put them together.
- I'd like to automate it with cli.

Translated with www.DeepL.com/Translator (free version)