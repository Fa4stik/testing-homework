import React from 'react';

import {render, waitFor} from '@testing-library/react';
import {Application} from "../../src/client/Application";
import {CartApi, ExampleApi} from "../../src/client/api";
import {initStore} from "../../src/client/store";
import {BrowserRouter, MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";

const basename = '/hw/store';
const api = new ExampleApi(basename);
const cart = new CartApi();
const store = initStore(api, cart);

// resizeobserver: https://greenonsoftware.com/articles/testing/testing-and-mocking-resize-observer-in-java-script/

const renderWithProviders = (ui: React.ReactNode) => {
    return render(
        <MemoryRouter initialEntries={[basename]} initialIndex={0} basename={basename}>
            <Provider store={store}>
                {ui}
            </Provider>
        </MemoryRouter>
    );
};

describe('Тесты для общих требований', () => {
    it('В шапке отображаются ссылки на страницы магазина, а также ссылка на корзину', () => {
        const { container } = renderWithProviders(<Application/>);

        const navLinks = [
            '/catalog',
            '/delivery',
            '/contacts',
            '/cart'
        ].map(l => basename+l)

        const links = Array
            .from(container.querySelectorAll('.nav-link'))
            .map(ln => ln.getAttribute('href'))

        expect(links).toEqual(navLinks)
    });

    it('Название магазина в шапке должно быть ссылкой на главную страницу', () => {
        const { container } = renderWithProviders(<Application/>);

        const linkNameShop = container
            .querySelector('.Application-Brand.navbar-brand')
            .getAttribute('href')

        expect(linkNameShop).toEqual(basename)
    })


});
