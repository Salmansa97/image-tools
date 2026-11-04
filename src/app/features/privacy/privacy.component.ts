import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';
import { breadcrumbSchema } from '../../seo/structured-data';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';

interface PolicySection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeroComponent, IconComponent],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  private readonly seo = inject(SeoService);

  protected readonly breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
  ] as const;

  /** Kept as data so the table of contents and the body can never fall out of step. */
  protected readonly sections: readonly PolicySection[] = [
    {
      id: 'images',
      title: 'Your images',
      paragraphs: [
        'ImageTools does not upload, receive, store, transmit or process your images on any server. All compression, resizing, cropping and conversion happens inside your own browser, using the image engine your browser already contains.',
        'When you add a file, it is read from your device into your browser’s memory. It stays there only while the tool is open. Removing a file, resetting a tool, navigating away or closing the tab releases it immediately. Nothing is written to disk unless you explicitly choose to download a result.',
        'Because no image data ever leaves your device, there is no copy of your pictures for us — or anybody else — to access, retain, analyse or disclose.',
      ],
    },
    {
      id: 'personal-data',
      title: 'Personal data',
      paragraphs: [
        'We do not ask for an account, an email address, a name or a payment method. There is no registration, no login and no profile.',
        'We do not use advertising networks, tracking pixels, fingerprinting scripts or third-party analytics on this site.',
      ],
    },
    {
      id: 'storage',
      title: 'Local storage and cookies',
      paragraphs: [
        'The site stores exactly one value in your browser’s local storage: your light or dark theme preference, under the key "imagetools-theme". It never leaves your browser and is used only to avoid a flash of the wrong theme when you return.',
        'No cookies are set. Clearing your browser’s site data removes the theme preference and nothing else, because nothing else is kept.',
      ],
    },
    {
      id: 'hosting',
      title: 'Hosting and server logs',
      paragraphs: [
        'The pages, scripts and stylesheets that make up this site are served as static files. Like any web server, the host may record standard request information such as an IP address, a timestamp and a user agent for the purpose of operating and securing the service.',
        'Those logs concern the delivery of the website itself. They never contain your images, because your images are never sent to the server in the first place.',
      ],
    },
    {
      id: 'third-parties',
      title: 'Third parties',
      paragraphs: [
        'The tools run entirely on code delivered from this site. No image data is shared with any third party, because no image data is transmitted at all.',
        'The application uses open-source libraries, which are bundled into the site’s own JavaScript rather than loaded from external services at runtime.',
      ],
    },
    {
      id: 'children',
      title: "Children's privacy",
      paragraphs: [
        'The service collects no personal information from anyone, of any age. Because there is no account system and no data collection, there is nothing to restrict by age.',
      ],
    },
    {
      id: 'rights',
      title: 'Your rights',
      paragraphs: [
        'Data protection law gives you rights to access, correct, export and erase personal data held about you. We hold none, so there is nothing to request, rectify or delete.',
        'If you would like to verify this for yourself, open your browser’s developer tools, switch to the network tab, and use any tool on the site. You will see that no image data is sent. You can also load the site and then disconnect from the internet — every tool continues to work.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      paragraphs: [
        'If this policy changes, the revised version will be published on this page. The core commitment — that your images are processed on your device and never uploaded — is a property of how the site is built, not a promise layered on top of it.',
      ],
    },
  ];

  constructor() {
    this.seo.apply({
      title: 'Privacy Policy — ImageTools',
      description:
        'ImageTools processes every image inside your browser. No uploads, no accounts, no tracking and no cookies. Read exactly what is and is not collected.',
      path: '/privacy-policy',
      ogType: 'article',
      structuredData: [
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy-policy' },
        ]),
      ],
    });
  }
}
