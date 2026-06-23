---
layout: post
title:  "A trip into Kotlin Multiplatform Projects, Part 3"
author: me
categories: [ Kotlin, Multiplatform, Android, iOS, Bluetooth ]
image: /assets/images/kotlin-multiplatform-pt1.jpg
featured: true
hidden: true
---

In the [previous post of this series](/kotlin-multiplatform-pt2), we enjoyed a full immersion trip 
about using **BLE** in a **Kotlin Multiplatform** project.
We integrated a BLE device by reading an exposed *characteristic* which sends notifications. Then we
delivered the updates to the user every time the characteristic changed.

Such a scenario is challenging but not so common in the every day app development. Therefore, 
I wanted to explore a better use case, like a simple **rest call** for fetching some users and 
the UI code for displaying them.

## Structuring the Kotlin MPP

A key point of Kotlin MPP is the **source sets organization**, in order to share as much code 
as possible. The new `kotlin-multiplaform` Gradle plugin helps such intent by allowing you to 
define various source directories, each targeting a different platform.

You will have a `commonMain` source set containing all the pure Kotlin code, shared across the 
platforms. Then, if you’re creating a mobile app, you can have a `androidMain` source set together 
with an `iosMain` set, defining the platform-specific code.

This structure introduces a clear **separation of scopes**, forcing the pure Kotlin module to be 
framework agnostic. For that reason, if you want to make out the most of this organization, 
you can take advantage of various design patterns to share as much logic as you can.

In addition, the powerful **Kotlin Coroutines** library allows you to make an 
**abstraction over threading**. Using it, you gain the advantage of writing asynchronous code 
in a synchronous and more readable form.

Such capabilities play very well in this multiplatform context.

## The Kotlin project

As introduced before, our project will be a **multiplatform app** which fetches a list of users 
by consuming a REST API. Once done, it shows the results to the application user as a list. 
Pretty common use case.

We’ll use [randomuser.me](https://randomuser.me/), an open API which returns a list of mock users, 
even with a profile picture. By consuming such service, we’ll get a Json response from which we’ll 
keep only the data we really need. Then we’ll compose a simple UI-representable model for letting 
the UI code to be as simple as we can.

We’ll try to maximize the code sharing by taking advantage of the mentioned 
multiplatform source sets.

Also – since we are good developers and we must keep the app responsive – we will dispatch in 
the background all the work that is not related to the UI. In order to do this, we will delegate 
the task to **Kotlin Coroutines**, applying the work deferral only in one point. 
Thus, *all our code will be synchronous, but sent in the background only in one place*.

> IMHO: this idea should be applied to most of the cases in which you need to defer work 
in the background. Most importantly, it helps you to avoid spreading of async code, 
callbacks or whatever. Frameworks like **RxJava** help you to overcome this, but for simple 
projects you may don’t want to add such dependency. By the way, this is another topic!

## Kotlin MPP – Fetching the users

As said before, we’re going to consume the [randomuser.me](https://randomuser.me/) API 
for getting some users data.

### Structuring sources. How?

In order to maximize the code sharing, will be great if we could reuse also the code 
which performs the HTTP call. We can follow two paths for achieving the result:

1. Create a common interface defining our requirements, and implement an Android version 
(**OkHttp** and the **Moshi** converter) and an iOS version (**Moya** and models implementing 
**Swift Codable** protocol);
2. Create a common class using a multiplatform HTTP client as
[Ktor client](https://ktor.io/clients/http-client/multiplatform.html) and a multiplatform 
JSON serialization library, like the cool [kotlinx.serialization](https://github.com/Kotlin/kotlinx.serialization) 
provided by the Kotlin team itself.

The second point looks attractive to us, but we want to maintain the **loose coupling** that the 
first point introduces. Hence, we can still create the common interface, called `UserApi`. 
We’ll implement it in the common module using **Ktor** and **kotlinx.serialization**. 
We’ll write all the code to depend on the interface. Therefore, if needed, we can throw away such 
implementation in favor of the first solution, without changing anything. Remember the 
**Liskov Substitution Principle (LSP)** and the **Dependency Inversion Principle (DIP)**? 
Uncle Bob will be proud of us!

So let’s create a class called `AllUsersResponseDto`, [defined here](https://github.com/MOLO17/kotlin-mpp-poc/blob/master/shared/src/commonMain/kotlin/com/molo17/damianogiusti/data/rest/AllUsersResponseDto.kt), and the UserApi interface, defined as:

```kotlin
interface UsersApi {
    suspend fun getUsers(): AllUsersResponseDto
}
```

It’s very simple. Ignore for now the `suspend` keyword. More on it will be explained later in this post.

### Kotlin MPP – Dependencies

The `AllUsersResponseDto` class will be annotated with the `kotlinx.serialization.Serializable`
annotation, allowing the compiler to generate serializers for us.

We add the serialization **Gradle** plugin to the classpath dependencies of project `build.gradle` file. 
Remember that it requires a Kotlin version greater than `1.3.20`.

```groovy
classpath "org.jetbrains.kotlin:kotlin-serialization:$kotlinVersion"
```

And then we update our module’s `build.gradle` with the platform-specific dependencies. 
We need to distinguish the artifact based on the source set we target.

```groovy
commonMain {
  dependencies {
    ...
    api "org.jetbrains.kotlinx:kotlinx-serialization-runtime-common:$serializationVersion"
  }
}
androidMain {
  dependencies {
    ...
    api "org.jetbrains.kotlinx:kotlinx-serialization-runtime:$serializationVersion"
  }
}
iOSMain {
  dependencies {
    ...
    api "org.jetbrains.kotlinx:kotlinx-serialization-runtime-native:$serializationVersion"
  }
}
```

Here we’re exposing the serialization lib using the `api` directive to other modules. 
If we decide to implement the `UserApi` interface with platform-dependent code, we’ll be free 
to use the `kotlinx.serialization` lib.

Then, as said before, we have to create the shared implementation of the `UsersApi`. 
It will use the **Ktor Client** library for making HTTP calls.

Import the **Ktor Client** library as we did previously. Moreover, we add the 
[Ktor JsonFeature](https://ktor.io/clients/http-client/features/json-feature.html), 
which integrates perfectly with `kotlinx.serialization`. 
It allows to define serializers for custom types, delegating to Ktor and Kotlin serialization lib
the dirty work.

```groovy
commonMain {
  dependencies {
    ...
    implementation "io.ktor:ktor-client-core:$ktorVersion"
    implementation "io.ktor:ktor-client-json:$ktorVersion"
  }
}
androidMain {
  dependencies {
    ...
    implementation "io.ktor:ktor-client-android:$ktorVersion"
    implementation "io.ktor:ktor-client-json-jvm:$ktorVersion"
  }
}
iOSMain {
  dependencies {
    ...
    implementation "io.ktor:ktor-client-ios:$ktorVersion"
    implementation "io.ktor:ktor-client-json-native:$ktorVersion"
  }
}
```

### Kotlin MPP – Shared implementation

Once we finish the setup, we can implement the `UserApi` interface.

```kotlin
class SharedUsersApi : UsersApi {
    private val httpClient = HttpClient {
        install(JsonFeature) {
            serializer = KotlinxSerializer().apply {
                setMapper(
                    type = AllUsersResponseDto::class, 
                    serializer = AllUsersResponseDto.serializer()
                )
            }
        }
    }
    override suspend fun getUsers(): AllUsersResponseDto =
        httpClient.get("https://randomuser.me/api/?results=50")
}
```

In less than 20 lines of code we have a fully working implementation, usable on both the platforms.

We marked the `getUsers` method as suspend. It’s an interface method defined in a context where 
implementations could be long-running tasks. In our case, the **Ktor Client** uses **Kotlin Coroutines**
to perform the HTTP call in background. Due to this, the `HttpClient.get(String)` method must be
called in a suspend function or inside another coroutine. Knowing that, we chose to implement it 
as `suspend`, delegating the coroutine management to the caller. 
*The class responsibility is only to fetch the users, not to explicitly manage background stuff.*

### Kotlin MPP – Shrinking the model

All we have done is about the data-access layer of our application. 
We haven’t implemented any UI logic nor any UI widget.

By looking at the DTO, a question lights up immediately.

*Do we really need all such fields?*

Obviously, we don’t.

The domain of our application wants to know only some basic info about the user. 
Hence something like:

```kotlin
data class User(
    val id: String,
    val name: String,
    val surname: String,
    val username: String,
    val email: String,
    val gender: Gender,
    val profilePictureUrl: String
) {
    enum class Gender {
        MALE, FEMALE
    }
}
```

Then we need to reduce the data obtained from the DTO to a simpler form. 
This mapping work will be implemented in a `Repository` class, in the common module. 
Such class allows to fetch all the users, hiding their origin. A basic **repository pattern**!

A pretty dummy implementation can be created as:

```kotlin
class UsersRepository(
    private val usersApi: UsersApi = SharedUsersApi()
) {
    suspend fun getAllUsers(): List<User> {
        val users = usersApi.getUsers()
        return users.results.map(::mapToUser)
    }
}
private fun mapToUser(result: AllUsersResponseDto.Result): User = User(
    id = result.login.uuid,
    name = result.name.first,
    surname = result.name.last,
    username = result.login.username,
    email = result.email,
    gender = if (result.gender == "female") User.Gender.FEMALE 
             else User.Gender.MALE,
    profilePictureUrl = result.picture.large
)
```

In the constructor we get an instance of `UserApi`, accessed by interface. 
For simplicity we set as default value a new `SharedUserApi` instance, that is the class 
we created before. In this way we can easily use it or replace it, as said at the beginning of the post.

## Displaying the users in our Kotlin app

Well done guys! We have a fully working structure usable on both **Android** and **iOS** 
(…oh well, we can’t say it works until we write down some tests…).

Reached this point, all we have to do is to present that user list into the UI. At first, 
we can be tempted to start writing the code directly into an **Android Activity** or inside an 
**iOS UIViewController**. However, doing this is not exactly what we want. In fact, we want 
to maximize the code sharing between the platforms, mainly to avoid duplication of code and *bugs*.

In order to accomplish our purpose, we apply the **Model View Presenter** pattern to our UI code. 
Our **Activity** / **UIViewController** will implement a **View** interface. 
The **Presenter** will hold and instance of the **View**, removing the need to be coupled 
to the framework classes. In the **Presenter** then, we’ll write down the data manipulation code, 
for preparing the User models to be shown.

### How to present users

First, let’s define **how** users should be presented in the UI. For the sake of example, 
our app will show a user in a simple row of a list. Each row will display the user name, 
the email, and the profile picture. *Such minimal, much wow*.

Having wrote down some “presentation ideas”, we create the model that will represent a displayed user:

```kotlin
data class UiUser(
    val id: String,
    val displayName: String,
    val email: String,
    val pictureUrl: String
)
```

We could have called it `DisplayableUser`, `UserToShow`… but `UiUser` was meaningful enough 
for the scope of this example.

The `id` in the model is used only for maintaining a simpler bidirectional flow. 
In fact, in such way we can reference the domain model starting from the displayable model.

Once defined how data will be presented, let’s define the `View` contract. 
This will explain how data are delivered to the UI. Also, it sums up the actions that the view will perform.

Since it will display a list of users, we’ll call it `UsersListView`:

```kotlin
interface UsersListView {
    fun showLoading()
    fun hideLoading()
    fun showUsers(displayableUsers: List<UiUser>)
    fun hideUsers()
}
```

Pretty immediate. Our **Activity** and **UIViewController** will respect this contract.

### Kotlin MPP – Present them!

Finally, we need to implement our **Presenter** class. We’ll call it `UserListPresenter`. 
Even this class will reside in the shared module, and thus will be written in pure Kotlin code. 
In fact, the `UserListView` is a key point to allow the Presenter to be framework-agnostic.

Our **Presenter** will expose two “lifecycle” methods:

- `attachView(v: UsersListView)`: the entry point. This will be called when the View is created. 
The Presenter will then store the reference of the given View as an instance property;

- `detachView()`: the exit point. Will be called when the view is going to be destroyed. 
Here the Presenter will set to `null` the reference to the View. This helps us also to avoid 
**retain cycles** in Swift code.

Also, the Presenter will manage a **CoroutineScope**. In such way we’ll be able to launch 
**Coroutines** and perform all the repository work in the background.  
We can take advantage of **class delegation** for this purpose. The Presenter will conform 
to the **CoroutineScope** interface, and we delegate the implementation to the `MainScope()` 
function. This usage is experimental, but we like to live on the edge.

At the end, our Presenter looks like this:

```kotlin
class UsersListPresenter(
    private val usersRepository: UsersRepository,
    private val backgroundDispatcher: BackgroundDispatcher
) : CoroutineScope by MainScope() {
    private var view: UsersListView? = null
    fun attachView(v: UsersListView) {
        view = v
        launch {
            view?.hideUsers()
            view?.showLoading()
            val users = withContext(backgroundDispatcher) {
                usersRepository.getAllUsers()
            }
            val displayableUsers = users.map(::mapToUiUser)
            view?.hideLoading()
            view?.showUsers(displayableUsers)
        }
    }
    fun detachView() {
        view = null
        cancel()
    }
}
```

How cool is this.

Once implemented the **Activity** and the **UIViewController**, the job is done.

But let me explain you a drawback.

## Background dispatching

Notice that our Presenter takes as a constructor parameter also a `BackgroundDispatcher` instance. 
This is a class used to abstract the **CoroutineDispatcher** we are using. But why?

The Repository by definition is an object which works with data. Thus, is a good practice 
to perform its work in the background. **Kotlin Coroutines** allow background dispatching by using, 
for example, the `Dispatchers.IO` object. While used on **Android**, all goes well.

The problem resides in the **Kotlin** implementation used in the **iOS** target. 
*Background dispatching is not yet supported, due to the complexity of managing 
object references between threads*. The feature seems to be planned for a future release, 
but right now only the Main thread dispatcher is available. You can find 
[the GitHub issue here](https://github.com/Kotlin/kotlinx.coroutines/issues/462).

That being said, then we cannot use the `Dispatchers.IO` object. For overcoming this issue, 
we created a `BackgroundDispatcher` which is an `expect object`. In the **Android** codebase is 
“actualized” using `Dispatchers.IO`, while in the iOS codebase is “actualized” using the Main dispatcher.

This doesn’t mean that the REST call will be made on the Main thread. **Ktor Client** 
sends computation in the background by itself. However, all the subsequent processing 
will take place on the UI thread.

In my opinion, this is an acceptable tradeoff for mobile applications that don’t require *hard work* 
in a background thread. In fact, threading might be safely handled by some other data-access library,
as **Ktor**, so the application may not need to handle work deferral by itself.

## Conclusions: our Kotlin every day app

We successfully build a Kotlin Multiplatform application. And look how cool it is:

![The final application on both Android and iOS.](/assets/images/kotlin-multiplatform-pt3.jpg)

With a pretty architecture, we maximized the code sharing, starting from the presentation layer 
and even reaching the data layer.

**JetBrains** team made a huge work making this possibile, and we must admit that 
such technology opens a plenty of possibilities. More to say, I believe **Kotlin Multiplatform** 
started walking the road to become a standard in multiplatform development.

Multiplatform projects are suitable also for other environments. You can build your backend 
using **Ktor Server** targeting **JVM**, and then share models with a frontend common module. 
Such module will contain all the logic we discussed about in this blog post. Further, it will 
be used by other platforms modules, like **Android**, **iOS**, **JS** and **JVM desktop**. 
And, obviously, it will contains tests!

Have a nice Kotlin and thanks for reading!

> Originally posted in [MOLO17 Blog](https://blog.molo17.com/2019/04/kotlin-a-trip-into-multiplatform-projects-part-3/)