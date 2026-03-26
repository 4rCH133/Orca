The gist of this suggestion is as follows:

If a user spams the upvote on a comment or post, or is indecisive between upvoting and not upvoting, we don't want to call the API every time.

It's better instead that upvotes/downvotes for a particular comment or post are locally cached in-memory as promises that trigger when a new page is loaded in OR the user exits the post OR the user exits the subreddit OR the user exits the main feed etc. etc. etc.

Basically, on any movement away from a page, we issue all upvotes for each item in that modal as opposed to upvoting on demand.
