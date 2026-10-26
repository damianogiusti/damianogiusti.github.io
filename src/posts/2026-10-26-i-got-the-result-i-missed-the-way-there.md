---
layout: post
title: "I Got the Result. I Missed the Way There"
author: me
categories: [AI, Software Development, Music, Opinion]
image: /assets/images/i-got-the-result-i-missed-the-way-there.jpg
featured: false
hidden: false
---

> _All opinions in this article are my own. They do not represent the views of my employer, and they
> should not be linked in any way to the company I work for._

Some days ago, someone shared a new AI art tool in a chat at work. Its website had one simple
promise: **"Start generating artwork immediately."**

A colleague of mine, who is also an artist, was sad about it. Her point was more or less this: that
sentence treats art like a productivity task. As if thinking, trying things and discovering were
only an annoying step before the result.

When I read her message, I didn't think about art. I thought about my job. What she
described — thinking, experimenting, discovering, and then looking at the result with a big smile —
is exactly how writing software feels to me on a good day.

This post is my reply. **AI can give me the result immediately. It can't give me what I
learned and what I felt on the way there — and the cheaper results become, the more I understand
that the way there was the part I wanted.**

When I look closer, the way there gives me two things that the result alone doesn't. The first is
understanding. The second is meaning.

## Understanding lives in the process

You don't really understand something because it works. You understand it because you fought with
it until it worked.

I learned this in 2020, on a [tablet app for medical operators](/resume/#molo17), used in
ambulances and rescue helicopters. One task was to connect the app to external defibrillators. The
vendor gave us an SDK written in C. No Android library, no clear documentation of the protocol.
Only C code.

So I read it. I studied the structs, one by one, and I learned how they were serialized into bytes.
Then I rebuilt that logic on the Android side, calling into the C code through the JNI. It took me
almost **four weeks**. Most of that time was frustration: wrong bytes, wrong order, a device that
didn't answer. And then, one day, it answered.

I still remember that feeling. Not because the code was perfect, but because I had *understood*
something that was closed to me a month before. That understanding is still with me today.

Now compare it with something I built recently. I designed a feature to keep setlists and a
metronome in sync between devices, for a band playing live, over the local network. It's the same
kind of problem: a protocol between devices. Some years ago it would have taken me weeks — discovery,
timing, error handling.

With an AI agent, it worked very quickly. And it was **while it was working** that I realized
something. I don't really know how those devices talk to each other on the LAN. I don't know how
errors are handled. I only see the result in the UI — the UI I imagined.

Same kind of problem. Opposite experience. This time I skipped the four weeks, and I got the result
without the understanding. If I had spent the time and the brain on it, I would have learned new
things. I didn't.

That's not a disaster. The feature works. But it's a small loss, and I can feel it.

## What costs nothing means less

The second thing the process gives me is harder to explain. It's what makes a result feel like
*mine*.

I play in bands, and for a long time I wanted a better tool to write and share chord sheets. So I
built one, as a side project, by hand. This was before AI coding agents existed. I remember the day
I wrote my first real chord sheet with my own editor, exported it and sent it to a friend. Nothing
special happened: a friend received a PDF. But I felt an enormous pride. That small file was the
result of many evenings of thinking and trying.

The same app is still alive today, but now I build it mostly with AI. It grows much faster, and I'm
happy about that. But new features don't give me the same feeling as that first export. They cost
me less, so they mean less to me.

I felt the same thing, much stronger, the first time I tried Suno, the AI that writes complete songs
from a short text. My first reaction as a musician was: this is useful. It can quickly make music
for a social media post, for example. My second reaction came a few minutes later: **we are in
trouble as musicians.** This thing can replace a lot of what we do.

The numbers are big. According to investor documents reported by Billboard, Suno users create
about [**7 million songs per day**](https://djmag.com/news/ai-platform-suno-generates-entire-spotify-catalogues-worth-of-music-every-two-weeks)
— that is the company's own number, not an independent one. And in July 2026 the streaming service
Deezer said that, at the peak in June, [**more than half of all new tracks uploaded every day were
AI-generated**](https://newsroom-deezer.com/2026/07/ai-music-exceeds-50-percent-daily-uploads-deezer/).

But the same Deezer report has a detail I find beautiful. Those AI tracks get only **1–3% of the
streams**. We produce a lot. We listen to very little of it.

I don't want to read too much into one number. Still, to me it says the same thing as my chord
sheets. What costs nothing to make is easy to make — and also easy to ignore. For the maker, and for
the listener.

## The other side: the result is often what matters

Now let me argue against myself, because the other side has strong points.

For an artist, the process *is* the work. For a developer, very often it isn't. When a band plays
live, nobody cares how I wrote the sync protocol. They want the metronome to click at the same time
on every device. The process is a cost. If AI makes the cost smaller, that's simply good.

And I have a personal example of this too. For years I wanted an app to change the pitch and the
tempo of songs, so I could rehearse a full band setlist, from start to end, with all the key
changes. No app I tried ever did it the way I needed. With AI, I built it very quickly. Then I
liked it so much that I pushed it further and published it: [**Downstep**](https://downstep.app).

I felt satisfaction. Almost fulfillment. And without AI, honestly, this app would not exist. It
would still be an idea in my head, like it was for years.

So the "result immediately" is not always a loss. Sometimes it's the only way an idea becomes real.

I accept all of this. But it doesn't change what I love. I love the process. Downstep made me happy
as a *product*. The defibrillator made me happy as an *engineer*. They are different kinds of happy,
and I don't want to lose the second one.

---

## Laundry and dishes

There's a sentence by a writer that went around the internet in 2024, and I think about it often:
[_"I want AI to do my laundry and dishes so that I can do art and writing, not for AI to do my art
and writing so that I can do my laundry and dishes."_](https://wist.info/maciejewska-joanna/81891/)

I feel the same about my work. There is a lot of boring work in any job: reports, forms, status
updates, the same small tasks every week. That's where I would love AI to take over. Not the part
where I sit with a hard problem, try, fail, and finally understand.

I'm not saying people who want results fast are wrong. We are all more impatient than before — me
included. I use AI every day, and I skipped the process myself more than once in this post. The
question is not *if* we use these tools. It's *where* we point them.

And here I really don't have an answer. Code, art, music production — they are all crafts. They
were built on slow, personal, often frustrating processes. Now the result is a few seconds away for
everyone.

So what happens to a craft when nobody needs to go through the process anymore? Does it disappear,
does it become a hobby for the few who still enjoy it, or does it turn into something new that we
can't see yet?

I'd really like to know what you think — especially if you make things, with code, with a brush, or
with an instrument.

---

_Written by me and my AI assistant :)_
