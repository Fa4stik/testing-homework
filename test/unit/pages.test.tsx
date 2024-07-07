import {CartApi, ExampleApi} from "../../src/client/api";
import {initStore} from "../../src/client/store";
import React from "react";
import {findByText, render, screen} from "@testing-library/react";
import {Provider} from "react-redux";
import {MemoryRouter} from "react-router-dom";
import {Home} from "../../src/client/pages/Home";
import {Catalog} from "../../src/client/pages/Catalog";
import {Contacts} from "../../src/client/pages/Contacts";
import {Delivery} from "../../src/client/pages/Delivery";
import {expect} from "@jest/globals";

const basename = '/hw/store';
const api = new ExampleApi(basename);
const cart = new CartApi();
const store = initStore(api, cart);

const renderWithProviders = (ui: React.ReactNode) => {
    return render(
        <MemoryRouter initialEntries={[basename]} initialIndex={0} basename={basename}>
            <Provider store={store}>
                {ui}
            </Provider>
        </MemoryRouter>
    );
};

describe('Тесты для страниц', () => {
    const findHeading = async (component: React.ReactNode, headingText: string) => {
        const {findByText, container} = renderWithProviders(component)
        return {el: await findByText(headingText), container}
    }

    it('Рендер главной страницы', async () => {
        const {findByText, container} = renderWithProviders(<Home />)
        const homeText = 'Welcome to Kogtetochka store!'
        const el = await findByText(homeText)
        expect(el).toBeTruthy()
        expect(container).toMatchSnapshot()
    })

    it('Рендер каталога страницы', async () => {
        const {el, container} = await findHeading(<Catalog />, 'Catalog')
        expect(el).toBeTruthy()
        expect(el.nodeName).toEqual('H1')
        expect(container).toMatchSnapshot()
    })

    it('Рендер условия доставки страницы', async () => {
        const {el, container} = await findHeading(<Delivery />, 'Delivery')
        expect(el).toBeTruthy()
        expect(el.nodeName).toEqual('H1')
        expect(container).toMatchSnapshot()
    })

    it('Рендер контакты страницы', async () => {
        const {el, container} = await findHeading(<Contacts />, 'Contacts')
        expect(el).toBeTruthy()
        expect(el.nodeName).toEqual('H1')
        expect(container).toMatchSnapshot()
    })
})