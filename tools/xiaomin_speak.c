#define COBJMACROS
#include <initguid.h>  // <--- 關鍵！必須加在最前面
#include <windows.h>
#include <sapi.h>
#include <stdio.h>

int main() {
    // 初始化 COM 庫
    if (FAILED(CoInitialize(NULL))) {
        printf("無法初始化 COM 庫\n");
        return 1;
    }

    ISpVoice *pVoice = NULL;
    // 創建語音對象
    HRESULT hr = CoCreateInstance(&CLSID_SpVoice, NULL, CLSCTX_ALL, &IID_ISpVoice, (void **)&pVoice);

    if (SUCCEEDED(hr)) {
        printf("小敏正在說話...\n");
        // 使用 Unicode 字串
        wchar_t *text = L"Learn from the best of others, be the best of yourself. Alex, I am speaking from Plain C now!";
        pVoice->lpVtbl->Speak(pVoice, text, 0, NULL);
        pVoice->lpVtbl->Release(pVoice);
    } else {
        printf("無法創建語音對象，錯誤代碼: %lx\n", hr);
    }

    CoUninitialize();
    return 0;
}