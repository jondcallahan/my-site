---
date: 2023-05-16
title: Budgeting with ChatGPT
layout: layout-post.html
tags: post
description: How I use the ChatGPT API to categorize every purchase in real-time.
---
## Intro
Coming up with a budget is hard. Tracking how well you're sticking to that budget is even harder. In this blog post I'll show you how I use the ChatGPT API to track, categorize, and monitor my spending. The best part: it only took me about 2 hours to figure out and set up and now I'll share all [the code](https://github.com/jondcallahan/ai-txns-categorizing) I use so you can set it up in even less time for yourself.

## Transaction notifications
Moments after I use my credit card or Apple Pay, a new entry is added to my Airtable spreadsheet. This entry includes the merchant name parsed by AI, the merchant category generated by AI, the amount, date, and time of the transaction extracted by AI - all in real time.

![transactions in a spreadsheet](/images/posts/ai-txns/airtable-pretty.png "transactions in a spreadsheet")

What kicks this whole thing off is an email. Instead of giving up my banking credentials (which can be _highly_ insecure), I set my bank up to send me an email for any transaction over my custom limit - $0.00! I know that Chase and Bank of America offer this but many others do as well.

## The workflow
![workflow](/images/posts/ai-txns/diagram.png "workflow")

## Email forwarding
After the transaction email is delivered we need to start working with the data it contains. Using Fastmail, I set up a rule for any email from `no.reply.alerts@chase.com` containing the text `Transaction alert`  to be moved to a special folder and automatically forwarded to Postmark, an email service provider.

## Processing the email
[Postmark](https://postmarkapp.com/) is an email service provider mostly used for sending emails, but they also have a feature that turns emails into JSON payloads. This JSON is what contains the rich data we'll use with ChatGPT! Other ESPs like Sendgrid and Mandrill offer the same, but I already have an account with Postmark for [Moment Journal](https://mymomentjournal.com)﻿ (a morning journal via email) and they parse 100 emails per month for free, which works great for my monthly spending.

To get your private forwarding address, set up a new server in Postmark and click the "Inbound Stream". Your private address will look like `XXXX123@inbound.postmarkapp.com` and is listed on the top of the page. Below that is an input for a webhook URL. We'll come back to that input later with the address of the serverless function we set up to run the AI integration.

## Our webhook
A webhook allows two applications to exchange data in real time. In our case we'll set up a webhook URL that accepts the email data from Postmark in a friendly format. I have been using [Deno](https://deno.com/runtime) for hobby programming for the past year and I love how fast it allows me to spin up a server. With [Deno Deploy](https://deno.com/deploy), I was able to get my webhook online in a matter of minutes. Here's how you can quickly get a hello world server launched on Deno Deploy:

1. Create a new repo in GitHub.
2. Create a new Deno Deploy project and choose the repo from step 1. Deno Deploy will automatically deploy the code anytime you push to the `main` branch of the repo in seconds.
3. Push the code snippet below to your GitHub repo in a file called `main.ts`
```ts
import { serve } from "https://deno.land/std@0.187.0/http/server.ts";

serve((req: Request) => new Response("Hello World"));
```
Visit the URL from Deno Deploy and you will see:


![browser showing deno deploy](/images/posts/ai-txns/browser.png "browser showing deno deploy")

Now that your webhook is online you can add the URL to Postmark. I set up a route `/inbound-email`  for my function so that I could continue serving Hello World text when visiting the main url. In the example above [https://low-bee-69.deno.dev](https://low-bee-69.deno.dev) makes the webhook url `https://low-bee-69.deno.dev/inbound-email` .

## Pre-processing the email
Since OpenAI models including ChatGPT charge by the token (roughly every syllable of text you send it) it's important to strip out any unneeded text before sending it over. For the Chase alerts, there is a lot of extra markup and text. I landed on converting the HTML to text after removing all elements with `display: none` and then removing even more text that's specific to the Chase alerts. That's it. We now have a string like

```txt
Transaction alert You made a $110.21 transaction Account Chase Sapphire Reserve (...####) Date Apr 30, 2023 at 2:23 PM ET Merchant TST* LEYE - ABA - CH Amount $110.21
```
## Prompting ChatGPT
The prompt is where magic happens. Prompting lets you ask ChatGPT to accomplish a task. For this project that magic is turning the string above into useful structured data. That means figuring out that `TST* LEYE - ABA - CH`  was at a **restaurant** (category) called **Aba** (merchant).

I've gone through a number of iterations for my prompt. It's been constant improvement but still has room to grow. I actually keep the old prompts in my source code because it's fun to see it evolve.

I've found it's good to give a sample output of what I'd like the JSON to look like and then explain the details of the schema. It's remarkable that with just a few sentences and one example, ChatGPT is able to understand my intention for it and the specific structure of output I'm looking for. It has worked incredibly over the past month that I've been running this. As of the time of publishing my prompt is:

```json
Format this credit card transaction as valid JSON like this {"date": "2021-12-31", "time": "4:35 PM ET", "amount": "$1.00", "account": "Checking (...123)", "merchant": "Sweet Green", "category": "Restaurant"}.

"merchant" should be enriched to the common, well-known merchant name without store specific, location, or point-of-sale provider info, formatted for legibility. If the merchant is part of a restaurant group, extract the specific restaurant name instead of the group name.

"category" should categorize the "merchant" into a budget category. Reply with JSON only.
```
It is almost entirely generic except for the sentence about restaurant groups. Before I added that sentence it parsed my sample transaction above as `merchant: Lettuce Entertain You` which is actually the restaurant group that owns Aba. Since they own a lot of restaurants around Chicago, it's not very helpful when looking back on my spreadsheet to see the group and not the specific restaurant. Since I've only needed to add one of these specifiers in the past month I don't think I'll need too many more, but I could see it happening.

## Calling the ChatGPT API
Now that we have the prompt and payload, ChatGPT can work it's magic ✨. We use the prompt as the system message and the transaction payload as the user message. When using the `gpt-3.5-turbo` model we'll get back something like

```json
{
  date: "2023-04-30",
  time: "2:23 PM ET",
  amount: "$110.21",
  account: "Chase Sapphire Reserve (...####)",
  merchant: "Aba",
  category: "Restaurant"
}
```
Amazing! From a garbled up transaction string we now have a well formatted merchant, a budget category for that merchant, and the transaction amount, date, time, and account.

## Storing in Airtable
Airtable is an online spreadsheet-database-hybrid. It has a lot of powerful features, but for this project the most helpful one is how easy it is to save data in. After setting up a new Airtable spreadsheet (base, in their parlance) with the same columns as the JSON above, we can send the response from ChatGPT over to Airtable with a straightforward `POST` request. My request looks like:

```ts
await fetch(
  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            ID: nanoid(), // nanoid generates a random ID for the row
            Date: result.data.date,
            Time: result.data.time,
            Amount: result.data.amount,
            Account: result.data.account,
            Merchant: result.data.merchant,
            Category: result.data.category,
          },
        },
      ],
      typecast: true,
    }),
  },
);
```

## Watching the magic ✨ happen
I was so excited to launch this and see it working! After swiping my credit card I'd eagerly open the Airtable app on my phone and in less than a minute see the new row with all this helpful information added. Instead of opening the app every time, I now use a wonderful little service [https://ntfy.sh](https://ntfy.sh) to send myself a push notification with the same data. It can't be used to sort, filter, and analyze my transaction data but I get to see this amazing little bot work its  magic. I am in awe of how accessible and powerful this state of the art AI model is.

## Lessons learned
This AI is extremely powerful but not perfect. The first weekend I had it online I shipped a bug that caused the transaction data to not actually be sent after the prompt. The AI still happily gave me back JSON in the format I requested but it was for a completely made up transaction to Starbucks. I had never been to Starbucks. In the AI world this is known as hallucination. It’s a known problem with some tricks to reduce its likelihood but it still happens.

I had problems initially getting back non JSON responses. The AI would provide the JSON and then add a sentence to the output explaining why it chose certain categories. That hasn’t happened in a while thanks to providing the sample output and likely some tuning by OpenAI.

A problem I’m still facing is getting consistent categories. For example some transactions get categorized as Grocery Store while others are Groceries. After running the app for 3 months I will provide it with a static list of categories to choose from. AirTable makes this very easy to correct so it’s not a big problem.

This was an extremely rewarding project that took relatively little time. It’s also dirt cheap, pennies per month on the high end. I am excited to find more ways to leverage the large language models in more areas of my life. I hope you do too. If you’ve found this interesting or deploy it yourself I’d love to hear about it. Please feel free to [email me](mailto:j@joncallahan.com). Thank you for reading.
