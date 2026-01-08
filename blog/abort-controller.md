---
date: 2023-10-18
title: You probably have a race condition
layout: layout-post.html
tags: post
description: How to prevent race conditions in react effects.
category: WRITING / REACT
---
## Intro

I've been working on a project that uses react hooks and I've been using the useEffect hook to fetch data from an API. The API call contains a `customerId` that the user selects from a dropdown. The effect looks something like this:

```javascript
useEffect(() => {
  const fetchData = async () => {
    const result = await fetch(
      `https://example.com/api/data?id=${customerId}`
    );
    const data = await result.json();
    setData(data);
  };
  fetchData();
}, [customerId]);
```

This works great on localhost with a stable and fast wifi connection, but the real world is a bit messier. Users’ networks are jittery and inconsistent. A cloud may pass over a satellite, a user may walk between two access points, or a user may just have a slow connection. On the server side we might have a [noisy-neighbor](https://en.wikipedia.org/wiki/Cloud_computing_issues%23Performance_interference_and_noisy_neighbors), a blip requiring a retry, or some other random source of latency. In these cases, the user may change the dropdown selection before the API call has finished. This has potential to cause a race condition!

## Race conditions overview

![diagram of race condition](/images/posts/abort-controller/race-condition.png "diagram of race condition")

A race condition happens when two requests are made and they come back in a different order than we expect. For example, request 1 is made and there is 500ms of latency due to some environmental reason. Request 2 is made and this one is much faster, only 150ms. Request 2 will resolve, then a short time later request 1 will resolve. If we don't handle this case in our code we will end up with the wrong data. Depending on the situation, this could be a minor annoyance or a major security issue, for example sending an invoice to the wrong customer on behalf of your user.

In the UI it looks like this:

<video width="100%" controls>
  <source src="/images/posts/abort-controller/before.mp4" type="video/mp4">
</video>

## Solving the race condition

When the user changes the dropdown, we should halt (abort) the in-flight request. The browser makes this easy by using the `new AbortController()` constructor. An `AbortController` allows us to programmatically halt any fetch requests, whenever we want. In this case, we want to stop the request for customer 1 since the user has changed the dropdown to customer 2. We can modify the code snippet to do this:
```javascript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const result = await fetch(
        `https://example.com/api/data?id=${customerId}`, {
          signal: controller.signal
        }
      );
      const data = await result.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Handle error, if needed
        console.error('Error:', error);
      }
    }
  };

  fetchData();

  return () => controller.abort();
}, [customerId]);
```

Notice how we’re constructing the controller, passing the result as a `signal` to the fetch call, and then using the same controller in the effect’s clean up function. Calling the `controller.abort()` method in the clean up function will abort the in-flight request for customer 1 🎉.

After making these changes, the UI is now fixed. The app state will now stay in sync with the user’s expectations:

<video width="100%" controls>
  <source src="/images/posts/abort-controller/after.mp4" type="video/mp4">
</video>

## Considerations
When we make use of the `AbortController` the browser will throw a specific error. We can handle these errors by excluding those with name `AbortError`. That will allow us to handle only true errors like `400…500` level errors (ex. bad or unauthorized requests, or server unavailable)  and avoid mistakenly marking this service as degraded.

## Conclusion
Using only a few more lines of code we can make our apps more resilient. Now when a user has a network issue or our server hits unexpected latency we can make sure the UI reflects the user’s expectations. We will now have a better user experience and a more secure app!

## Useful links
* [React useEffect](https://react.dev/reference/react/useEffect)
* [Abort controller](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/AbortController) and `controller.abort()` [method](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)
