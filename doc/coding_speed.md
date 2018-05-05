# Coding Speed

## Scenario

The question that I want to answer with stats:

* How often do I code everyday?
* How the speed/frequency of coding is correlated to my perceived
  productivity?
* In which language that I code the fastest?
* Is the speed of coding correlated to my langugae proficiency?

## Implementation

There must be some context when talking about coding speed. To be
specific, the time interval, the concept of 'displacement'. 

For the time interval, there must be the start and the end:

- start
  * the time when we enter a buff/file
  * restart coding after an idle time
- end
  * the time when we leave a buff/file
  * idle over a threhold of time after enter a buff/file

For the concept of 'displacement', I would use the number of 'ping'
event received during a single context. Other metric should be consider
 as well, the number of line added, the number of characters entered.

When [buff entered]
  end the current session
  create a new session with entered buff info
  wait for ping event

When [ping]
  check if current session is expired
  if true, create a new session with current buff info
  else, update the current session

When [buff leave]
  check 1to1 relationship against the current session by verify buff
  info
  if true, then close the session
  else, it's a bug to be resolved.
