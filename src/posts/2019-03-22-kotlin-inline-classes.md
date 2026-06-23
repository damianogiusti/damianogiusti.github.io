---
layout: post
title:  "Kotlin inline classes, such magic"
author: me
categories: [ Kotlin, Android ]
image: /assets/images/kotlin-inline-classes.jpg
featured: true
hidden: true
---
Starting with **Kotlin 1.3**, the standard library ships with a new cool feature: **inline classes**.

## Inline classes in Kotlin

**Kotlin inline classes** are a nice and clean way to add strong typings to your code. 
They are meant to remove the heap overhead involved when creating wrapper types for simpler types 
or even for primitive ones.

You can declare a new inline class like you do with your **data classes**, but with the limitation 
that an inline class can hold just a single property.
While at compile-time they appear like normal **classes** or **data classes**, at runtime the type 
is represented using the type and the value of the property defined. That’s why only a single 
parameter is allowed in the constructor.

The behavior is the same as inline functions, where the body of the function is added in place 
instead of actually invoking the function.

**Kotlin inline classes** can also have methods, but cannot have other stored properties. 
Only the one defined into the constructor is allowed. 

At runtime, the method calls are represented as static method calls.

## An example

Let’s say that we have a `StringWrapper` inline class, which has the method `greet()`.

```kotlin
inline class StringWrapper(val string: String) {
    fun greet() = "Hello, $string!"
}

StringWrapper("Damiano").greet()
```

The compiler will translate the invocation as a static method call, like

```java
StringWrapperKt.greet("Damiano");
```

Inline classes can also implement **interfaces**. And this is the point of this blog post.

I want to tell you a little story, which will denote the magic behind inline classes. 

The story has **Kotlin 1.3.21** as main character.

## Once upon a time…

In a project for a customer of the company I work with, we have a form which the user can fill. 
It is completely driven by the customer's backend, that was already in place when we started
the project. By consuming it, our Android app receives a JSON descriptor and renders a list of 
UI controls based on it. When the user finished to fill them, it can perform a submit to a REST endpoint. 

If not treated carefully, the managing of the form items can be tricky. 
Specially when sending the data to the backend using a JSON DTO.

For a particular case, we needed to make an abstraction for a field of the DTO. 
Such field, in certain cases, could hold a plain string value and a object with three keys in others.

We defined a marker interface for represent the type values that the field could assume. 
We named it `ProductValue`. Then we defined the two implementations, named respectively 
`StringProductValue` and `PropertiesProductValue`.

## Magic happens

Since `StringProductValue` was meant to contain only a plain string, we decided to try out 
the new **inline classes** feature.

```kotlin
inline class StringProductValue(val value: String): ProductValue
```

How cool is this! We wrap our string value adding a stronger and meaningful type `StringProductValue`. 
And we didn’t add any overhead, since at compile time the class is directly unwrapped by the compiler
to a plain `String`, and seen as a `String` at runtime.

Say that again.

> At compile time the class will be directly unwrapped by the compiler to a plain String, 
and seen as a String at runtime.

In fact, we had a problem that occurred when trying to pass an instance of our `StringProductValue` 
inline class to a method that accepted an instance of the abstract super-type `ProductValue`. 
At compile time we had no issues. But at runtime, we received a `ClassCastException`.

```
java.lang.ClassCastException: java.lang.String cannot be cast to my.package.ProductValue
```
In a nutshell, the method which maps the field value to the DTO accepts a `ProductValue` type, 
which is the super-type. But at runtime, our implementation class is seen as a `java.lang.String`.
Thus an exception is thrown just by calling such method passing in the “unwrapped” string.

Eventually, for our use case a **data class** suited better and obviously fixed the issue.

## TL;DR – When to use Kotlin inline classes

Use **Kotlin inline classes** responsibly. You can let them implement interfaces and you can add 
methods to them. However, making abstractions using interface implementations made with inline 
classes isn’t fully supported at time of writing. Moreover, it can lead to unexpected runtime errors.

In conclusion, I must say that inline classes are a very powerful feature. 
But they are still experimental, and there must be a reason for that.

Have a nice Kotlin and thanks for reading!

PS: don’t forget to follow my other [posts about the Kotlin programming world](/categories#Kotlin)!

> Originally posted in [MOLO17 Blog](https://blog.molo17.com/2019/03/kotlin-inline-classes-such-magic/)