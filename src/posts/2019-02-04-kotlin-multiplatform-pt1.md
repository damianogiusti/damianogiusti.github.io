---
layout: post
title:  "A trip into Kotlin Multiplatform Projects, Part 1"
author: me
categories: [ Kotlin, Multiplatform, Android, iOS, Bluetooth ]
image: /assets/images/kotlin-multiplatform-pt1.jpg
featured: false
hidden: false
---
We at **MOLO17** are always looking for **new technologies** that can boost our productivity 
and allow us to deliver software at its best. Since 2017 we started adopting **Kotlin** with profit 
as the main language for developing **Android** applications. After we wrote a huge project with
**JetBrains** language, I personally started believing that this new technology is going to
introduce a breeze of innovation in modern software development. 
Recently, I invested my time studying the **Kotlin Multiplatform** Feature.


## Kotlin Multiplatform

**Kotlin Multiplatform** (or MPP, Multi Platform Project) is a powerful tool that combines
**Kotlin/JVM** (which compiles into JVM bytecode), **Kotlin/JS** (which compiles into Javascript) 
and **Kotlin/Native** (which compiles into low-level binaries) together allowing a developer 
to write a common codebase entirely in Kotlin, specialize it with some platform-dependent 
implementations, and ship a software which runs on the JVM (or Android), on the web and, why not, 
in your iPhone. And when I say that runs, I mean that runs absolutely well.


## Cool, isn’t it?

Some of you may argue that this is yet another way to write a cross-platform mobile app, 
like the Cordova or Ionic frameworks using JS, or Xamarin using C#.

But this is not what the people behind Kotlin Multiplatform MPP meant when designing this technology.

Just by looking on how the project will be structured by following the JetBrains’ guidelines, 
we can state that the principle behind this kind of multiplatform concept is **code sharing**.
It’s made possible by defining in a common module the Kotlin pure definitions and implementations
of entities and classes. In this module, all your business logic, presentation logic 
and – with the right libraries – data-access logic will take place. The rule of thumb is 
always to be **framework-agnostic**.

The [Kotlin Academy Portal application](https://github.com/MarcinMoskala/KtAcademyPortal) developed 
by Marcin Moskala is just one of the proofs of the feasibility of these intentions.

As a Software Engineer with a main focus on the Android platform, 
I started some projects for mastering the **Kotlin Multiplatform**.

## The Kotlin Multiplatform project

The first project I developed was a simple Bluetooth mobile library, for the Android and iOS platforms.
The goal was to write a common API for both the environments, for a simplified access to the Bluetooth framework.  

I started by creating the project following the documentation at Kotlin’s website. 
Pretty easy to setup and get running. The cool thing I really appreciated is that we can create 
a MPP directly from Android Studio! So no need to install **IntelliJ**.
The first-step expectation was an API that allowed the developer to start the discovery of BLE peripherals. 
So I started defining the common interface for this class, something like this:

```kotlin
expect class BluetoothAdapter {
    fun discoverDevices(callback: (BluetoothDevice) -> Unit)
    fun stopScan()
}
```

## The expect keyword in Kotlin Multiplatform

Notice the `expect` keyword at the beginning of the class declaration. 
In the Kotlin Multiplatform context, the `expect` keyword defines an entity 
(a class, a method, a property, or even a constructor) that the developer is declaring 
in the common module and is expected to be present in the target platforms. By “expecting”
such entity, the developer needs also to “actualize” it in the platform-dependent module, 
using the `actual` keyword. A sort of interface-implementation paradigm, but more dynamic. 
And here comes the sugar.

## Kotlin Multiplatform – Android Target

When targeting in Kotlin Multiplatform the Android platform, nothing’s different with 
the implementation you’ll do with a standard project approach. You need our lovely god `Context` 
object, from which you get a `BluetoothManager` and then you can access to the system 
`BluetoothAdapter` instance.

A powerful feature on the `expect`/`actual` paradigm is that *if you expect a class, 
you’re not required to expect also the constructor of that class*. So in my case, 
I was able to create the actual definition that required a `Context` instance in the constructor, 
which allowed me to implement the definition as I wanted to.

```kotlin
actual class BluetoothAdapter(
    private val context: Context
) : ScanCallback() {
    // ...
    
    actual fun discoverDevices(callback: (BluetoothDevice) -> Unit) {
        this.callback = callback
        bluetoothAdapter.bluetoothLeScanner.startScan(this)
    }
    actual fun stopScan() {
        bluetoothAdapter.bluetoothLeScanner.stopScan(this)
        callback = null
    }
}
```

## Kotlin Multiplatform – iOS Target

More sugar comes when targetting the iOS platform. Apart from the benefits you get by not using **Xcode**,
you get other advantages by using **Kotlin as iOS programming language**. The Kotlin lib offers 
bridges classes which translates the **Objective-C** system APIs (like `CoreBluetooth` in our case) 
in Kotlin classes. That allowed me to implement the iOS “actualization” of my Bluetooth class 
using `CoreBluetooth`, writing in Kotlin. Awesome.

I instantiated the `CBCentralManager` as usual, I set a `CBCentralManagerDelegate` instance to it 
and started receiving the discovered peripherals. Notice also that when translating protocol to Kotlin, 
the compiler adds the `Protocol` suffix to the base name.

At first, I wanted to make my actual class named `BluetoothAdapter` implement the delegate protocol 
directly. Hence, I did it. But since the `CBCentralManagerDelegate` implements the `NSObjectProtocol`, 
I was required to let my actual class implement also the methods defined by this protocol. 
To avoid to implement them, I let the class extend from `NSObject`, for having the required methods 
already implemented. All went well until I tried to use my class definition into a **Swift** project. 

The compiler failed with the following error:

```
'BluetoothAdapter' is unavailable: Kotlin subclass of Objective-C class can’t be imported
```

![Xcode compiler error due to unavailability of BluetoothAdapter](https://blog.molo17.com/wp-content/uploads/2019/02/Schermata-2019-02-02-alle-16.47.59.png)

### Objective-C headers

By looking into the **Objective-C** generated headers, I saw that my `BluetoothAdapter` class
was correctly compiled but marked as unavailable with the above message. So I was not able to 
instantiate a new one or even define it as property type.

After some *googling*, I figured out that this behavior is a wanted limitation for avoiding 
potentially complex inheritance trees with the `Foundation` classes on the Kotlin side.
Obtaining an instance of my class then was not possible. I declared in Kotlin a function that 
returned and instance of my type, and when compiled the return type became `NSObject`. 
Hence I wrote down my two cents.

In a nutshell:
> We can use a class which inherits from **Foundation** objects only from the Kotlin side. 
If we need to create an instance of it from Swift code, we need to create a builder function in Kotlin.

That's because Kotlin knows how it’s defined and how to create it. Something like this:

```kotlin
fun makeBluetoothAdapter() = BluetoothAdapter()

actual class BluetoothAdapter: NSObject() { ... }
```

And then in the Swift implementation:

```swift
private let myClass = ConsumerClass(
    bluetoothAdapter: BluetoothAdapterKt.makeBluetoothAdapter()
)
```

Our Kotlin codebase of our **Kotlin Multiplatform** project will know the type of the instance 
we pass with the `bluetoothAdapter` label, and all will work correctly.

Now, let’s go back to my original purpose. I left my actual class without any extension, 
and I eventually created an `object` property subclassing `NSObject` and implementing 
the `CBCentralManagerDelegate` protocol.

```kotlin
actual class BluetoothAdapter {
    // ... 
    private val delegateImpl = object : NSObject(), CBCentralManagerDelegateProtocol {
        override fun centralManager(
            central: CBCentralManager,
            didDiscoverPeripheral: CBPeripheral,
            advertisementData: Map<Any?, *>,
            RSSI: NSNumber
        ) {
            // ... 
        }
    }
    private val manager = CBCentralManager().apply { delegate = delegateImpl }
    actual fun discoverDevices(callback: (BluetoothDevice) -> Unit) {
        // ...
        manager.scanForPeripheralsWithServices(null, null)
        onDeviceReceived = callback
    }
    actual fun stopScan() {
        manager.stopScan()
        onDeviceReceived = null
    }
}
```

## Conclusion

And here we go! A common class and the platform-specific implementations.

Following the **JetBrains** guidelines, I was able to add as *Build Phase* a script that launches 
the Gradle task for producing the **Cocoa framework** file, embeddable into an **Xcode** project.

I developed two simple apps, **Android** with Kotlin and **iOS** with Swift. They show a list of 
the discovered devices using the common module. The result was great. The Bluetooth discovery worked
flawlessy as if it was implemented in the standard way thanks to **Kotlin Multiplatform**.

The following step was the integration of a standard BLE communication… But that's may be a next post! 

Thanks for reading!

Cover image credits: blog.jetbrains.com

> Originally posted in [MOLO17 Blog](https://blog.molo17.com/2019/02/a-trip-into-kotlin-native-multiplatform-projects-part-1/)