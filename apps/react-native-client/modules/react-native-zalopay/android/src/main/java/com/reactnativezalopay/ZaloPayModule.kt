package com.reactnativezalopay

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ActivityEventListener
import android.content.Intent
import android.app.Activity

import vn.zalopay.sdk.ZaloPaySDK
import vn.zalopay.sdk.Environment
import vn.zalopay.sdk.listeners.PayOrderListener
import vn.zalopay.sdk.ZaloPayError

class ZaloPayModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    init {
        reactContext.addActivityEventListener(this)
        try {
            init(2554, true)
        } catch (e: Throwable) {
            println("[ZaloPayModule] Constructor init error: " + e.message)
        }
    }

    override fun getName(): String {
        return "ZaloPayModule"
    }

    @ReactMethod
    fun init(appId: Int, isSandbox: Boolean) {
        val env = if (isSandbox) Environment.SANDBOX else Environment.PRODUCTION
        val context = reactContext.applicationContext
        try {
            val sdkClass = ZaloPaySDK::class.java
            var initialized = false
            for (m in sdkClass.methods) {
                if (m.name.lowercase().contains("init")) {
                    try {
                        val params = m.parameterTypes
                        if (params.size == 2) {
                            m.invoke(null, appId, env)
                            initialized = true
                            println("[ZaloPayModule] Initialized via static init(2 params)")
                            break
                        } else if (params.size == 3) {
                            m.invoke(null, appId, context, env)
                            initialized = true
                            println("[ZaloPayModule] Initialized via static init(3 params)")
                            break
                        }
                    } catch (e: Exception) {
                    }
                }
            }
            if (!initialized) {
                val instance = ZaloPaySDK.getInstance()
                for (m in instance.javaClass.methods) {
                    if (m.name.lowercase().contains("init")) {
                        try {
                            m.invoke(instance, appId, env)
                            println("[ZaloPayModule] Initialized via instance init")
                            break
                        } catch (e: Exception) {}
                    }
                }
            }
        } catch (e: Throwable) {
            println("[ZaloPayModule] Init exception: " + e.message)
        }
    }

    @ReactMethod
    fun payOrder(zpTransToken: String, promise: Promise) {
        val act = reactContext.currentActivity
        if (act == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        val listener = object : PayOrderListener {
            override fun onPaymentSucceeded(transactionId: String, transToken: String, appTransID: String) {
                val map: WritableMap = Arguments.createMap()
                map.putString("status", "success")
                map.putString("transactionId", transactionId)
                promise.resolve(map)
            }

            override fun onPaymentCanceled(zpPayToken: String, appTransID: String) {
                val map: WritableMap = Arguments.createMap()
                map.putString("status", "cancelled")
                promise.resolve(map)
            }

            override fun onPaymentError(zaloPayError: ZaloPayError, zpPayToken: String, appTransID: String) {
                val map: WritableMap = Arguments.createMap()
                map.putString("status", "error")
                map.putInt("errorCode", zaloPayError.ordinal)
                map.putString("message", zaloPayError.name)
                promise.resolve(map)
            }
        }

        try {
            ZaloPaySDK.getInstance().payOrder(act, zpTransToken, "historyapp://", listener)
        } catch (e: Throwable) {
            promise.reject("PAY_ORDER_ERROR", e.message, e)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    }

    override fun onNewIntent(intent: Intent) {
        ZaloPaySDK.getInstance().onResult(intent)
    }
}
