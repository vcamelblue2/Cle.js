import { defineHtmlComponent } from "cle.js/lib/caged-le";

export const CircleImage = defineHtmlComponent(/*html*/`

    <script>({
        let: {
            src: "https://parceljs.org/logo.49e8bbc1.svg",
            custom_style: {}
        },

        style: $ => ({
            borderRadius: '50%',  
            ...$.custom_style
        })
    })</script>

    <view>
        <img [src]="$.src">
    </view>

`, { isRemote: false })