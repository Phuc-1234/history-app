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
    }

    override fun getName(): String {
        return "ZaloPayModule"
    }

    @ReactMethod
    fun init(appId: Int, isSandbox: Boolean) {
        try {
            val env = if (isSandbox) Environment.SANDBOX else Environment.PRODUCTION
            ZaloPaySDK.init(appId, env)
            println("[ZaloPayModule] Initialized appId=$appId sandbox=$isSandbox")
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
        try {
            ZaloPaySDK.getInstance().onResult(intent)
        } catch (e: Throwable) {
            println("[ZaloPayModule] onNewIntent error: " + e.message)
        }
    }
}
