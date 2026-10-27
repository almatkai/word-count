/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `count` command */
  export type Count = ExtensionPreferences & {}
  /** Preferences accessible in the `count-screenshot` command */
  export type CountScreenshot = ExtensionPreferences & {}
  /** Preferences accessible in the `count-overlay` command */
  export type CountOverlay = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `count` command */
  export type Count = {}
  /** Arguments passed to the `count-screenshot` command */
  export type CountScreenshot = {}
  /** Arguments passed to the `count-overlay` command */
  export type CountOverlay = {}
}

